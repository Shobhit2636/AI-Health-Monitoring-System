from typing import List, Dict, Any, Optional
from loguru import logger
from app.core.config import settings


class GeminiService:
    def __init__(self):
        self.available = False
        self.model = None
        if settings.GEMINI_API_KEY:
            try:
                import google.generativeai as genai
                genai.configure(api_key=settings.GEMINI_API_KEY)
                self.model = genai.GenerativeModel(
                    model_name="gemini-1.5-flash",
                    generation_config={
                        "temperature": 0.7,
                        "top_p": 0.95,
                        "top_k": 40,
                        "max_output_tokens": 1024,
                    },
                    safety_settings=[
                        {"category": "HARM_CATEGORY_HARASSMENT",        "threshold": "BLOCK_NONE"},
                        {"category": "HARM_CATEGORY_HATE_SPEECH",        "threshold": "BLOCK_NONE"},
                        {"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT",  "threshold": "BLOCK_NONE"},
                        {"category": "HARM_CATEGORY_DANGEROUS_CONTENT",  "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
                    ]
                )
                self.available = True
                logger.info("✅ Gemini AI (gemini-1.5-flash) initialized successfully!")
            except Exception as e:
                logger.error(f"❌ Gemini init failed: {e}")
        else:
            logger.warning("⚠️ GEMINI_API_KEY not set. Using fallback responses.")

    async def analyze_medical_report(self, report_text: str, file_name: str) -> str:
        if not self.available:
            return self._fallback_report_analysis(file_name)

        prompt = f"""You are an expert medical AI assistant. Analyze this medical report carefully and provide a detailed response in the following format:

## 📋 Report Summary
Brief overview of what this report contains.

## 🔢 Key Values & Findings
List all important measurements with their status (Normal ✅ / Abnormal ⚠️ / Critical 🚨):
- Value name: [number] [unit] — Status

## ⚠️ Areas of Concern
Any alarming values, abnormal findings, or conditions that need attention.

## 💊 Recommendations
Specific actionable steps the patient should take.

## 🥗 Lifestyle Tips
Diet, exercise, and lifestyle changes based on the findings.

---
Report: {file_name}
Content:
{report_text[:5000]}

Note: Always end with a disclaimer that this is AI analysis and professional medical consultation is recommended."""

        try:
            response = self.model.generate_content(prompt)
            return response.text
        except Exception as e:
            logger.error(f"Gemini report analysis error: {e}")
            return self._fallback_report_analysis(file_name)

    async def chat(
        self,
        message: str,
        history: List[Dict[str, str]],
        user_context: Optional[Dict[str, Any]] = None
    ) -> str:
        if not self.available:
            return self._fallback_chat_response(message)

        # Build patient context
        context = ""
        if user_context:
            age = user_context.get("age", "unknown")
            conditions = ", ".join(user_context.get("conditions", [])) or "None reported"
            medications = ", ".join(user_context.get("medications", [])) or "None"
            context = f"""
Patient Information:
- Age: {age}
- Known conditions: {conditions}
- Current medications: {medications}
"""

        system_prompt = f"""You are HealthBot, a knowledgeable and empathetic AI health assistant developed for an AI Health Monitoring System.

Your role:
✅ Answer health and medical questions clearly and accurately
✅ Explain medical terms in simple language
✅ Provide evidence-based health advice
✅ Help users understand their health metrics and reports
✅ Give dietary, lifestyle and wellness recommendations
✅ Guide users when they need professional medical help

{context}

Important rules:
- Always be empathetic and supportive
- For emergency symptoms (chest pain, difficulty breathing, severe bleeding), immediately advise calling emergency services (112 in India)
- Always remind users you are an AI and cannot replace professional medical advice
- Respond in the same language the user uses (Hindi or English or Hinglish)
- Keep responses concise but comprehensive
- Use emojis to make responses friendly and readable"""

        # Build chat history for Gemini
        chat_history = []
        for msg in history[-10:]:
            role = "user" if msg["role"] == "user" else "model"
            chat_history.append({
                "role": role,
                "parts": [msg["content"]]
            })

        try:
            chat = self.model.start_chat(history=chat_history)
            full_message = f"{system_prompt}\n\nUser message: {message}"
            response = chat.send_message(full_message)
            return response.text
        except Exception as e:
            logger.error(f"Gemini chat error: {e}")
            return self._fallback_chat_response(message)

    def _fallback_report_analysis(self, file_name: str) -> str:
        return f"""## 📋 Medical Report Analysis — {file_name}

**Status**: AI Analysis unavailable (Gemini API not configured)

Please configure `GEMINI_API_KEY` in your `.env` file to enable AI-powered report analysis.

⚕️ *Always consult a qualified medical professional for report interpretation.*"""

    def _fallback_chat_response(self, message: str) -> str:
        msg = message.lower()
        responses = {
            ("headache", "sir dard", "migraine"): "🤕 Headaches can be caused by dehydration, stress, eye strain, or lack of sleep. Try drinking water, resting in a dark room, and taking OTC pain relief. If severe, persistent, or with fever/vomiting, consult a doctor immediately.",
            ("fever", "bukhar", "temperature"): "🌡️ For fever above 38.5°C (101.3°F): rest, stay hydrated, take paracetamol. Seek medical attention if fever exceeds 39.5°C, lasts more than 3 days, or is accompanied by rash or difficulty breathing.",
            ("diabetes", "sugar", "glucose", "insulin"): "💉 Diabetes management tips:\n• Monitor blood sugar regularly\n• Follow a low-carb, high-fiber diet\n• Exercise 30 min daily\n• Take medications as prescribed\n• Regular HbA1c tests every 3 months\n• Stay hydrated",
            ("heart", "chest pain", "dil", "cardiac"): "❤️ **IMPORTANT**: For chest pain, call 112 immediately!\n\nFor heart health:\n• Monitor BP and cholesterol\n• Exercise regularly\n• Avoid smoking and excess alcohol\n• Low-sodium, heart-healthy diet\n• Regular ECG checkups",
            ("blood pressure", "bp", "hypertension", "hypotension"): "💊 Blood Pressure Guide:\n• Normal: <120/80 mmHg\n• Elevated: 120-129/<80\n• High: >130/80\n\nTo manage BP:\n• Reduce salt intake\n• Exercise regularly\n• Manage stress\n• Take medications as prescribed\n• Monitor daily",
            ("weight", "bmi", "obesity", "mota"): "⚖️ Healthy BMI: 18.5–24.9\n\nWeight management tips:\n• Balanced diet with portion control\n• 150 min exercise per week\n• Drink 8 glasses of water daily\n• Avoid processed foods\n• Get adequate sleep (7-8 hrs)",
            ("sleep", "insomnia", "neend"): "😴 Better sleep tips:\n• Fixed sleep schedule\n• Avoid screens 1 hr before bed\n• Keep room cool and dark\n• Limit caffeine after 2 PM\n• Try relaxation techniques",
            ("stress", "anxiety", "tension", "depression"): "🧘 Mental wellness tips:\n• Practice deep breathing\n• Regular physical exercise\n• Talk to someone you trust\n• Meditation and mindfulness\n• Consult a mental health professional if symptoms persist",
        }
        for keywords, response in responses.items():
            if any(k in msg for k in keywords):
                return response + "\n\n⚕️ *Configure GEMINI_API_KEY for full AI-powered responses.*"
        return "👋 Hello! I'm HealthBot, your AI health assistant.\n\nI'm currently in limited mode. To unlock full AI capabilities, please configure your Gemini API key.\n\nFor medical emergencies, always call **112** 🚨"


gemini_service = GeminiService()

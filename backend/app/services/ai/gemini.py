from typing import List, Dict, Any, Optional
from loguru import logger
from app.core.config import settings

class GeminiService:
    def __init__(self):
        self.available = False
        if settings.GEMINI_API_KEY:
            try:
                import google.generativeai as genai
                genai.configure(api_key=settings.GEMINI_API_KEY)
                self.model = genai.GenerativeModel("gemini-1.5-flash")
                self.available = True
                logger.info("Gemini AI initialized.")
            except Exception as e:
                logger.warning(f"Gemini init failed: {e}")
        else:
            logger.warning("GEMINI_API_KEY not set. Using fallback responses.")

    async def analyze_medical_report(self, report_text: str, file_name: str) -> str:
        if not self.available:
            return self._fallback_report_analysis(file_name)
        try:
            prompt = f"""Analyze this medical report and provide:
1. **Summary**: Brief overview
2. **Key Values**: Important measurements (normal/abnormal)
3. **Concerns**: Any alarming findings
4. **Recommendations**: Follow-up actions
5. **Lifestyle Tips**: Health advice

Report: {file_name}
Content: {report_text[:4000]}

Use simple language. Include disclaimer about professional consultation."""
            response = self.model.generate_content(prompt)
            return response.text
        except Exception as e:
            logger.error(f"Gemini error: {e}")
            return self._fallback_report_analysis(file_name)

    async def chat(self, message: str, history: List[Dict[str, str]], user_context: Optional[Dict[str, Any]] = None) -> str:
        if not self.available:
            return self._fallback_chat_response(message)
        try:
            ctx = ""
            if user_context:
                ctx = f"\nPatient: age={user_context.get('age','?')}, conditions={user_context.get('conditions',[])}"
            system = f"You are HealthBot, an empathetic AI health assistant. Answer health questions clearly and safely.{ctx}\nAlways remind users you're an AI, not a doctor. For emergencies, direct to call 112."
            chat_history = [{"role": m["role"], "parts": [m["content"]]} for m in history[-8:]]
            chat = self.model.start_chat(history=chat_history)
            response = chat.send_message(f"{system}\n\nUser: {message}")
            return response.text
        except Exception as e:
            logger.error(f"Gemini chat error: {e}")
            return self._fallback_chat_response(message)

    def _fallback_report_analysis(self, file_name: str) -> str:
        return f"""**Medical Report Analysis** — {file_name}

**Status**: Demo Mode (Gemini API not configured)

**Summary**: Your report has been received successfully.

**To enable AI analysis**: Add your `GEMINI_API_KEY` to the `.env` file and restart the server.

**Next Steps**:
- Consult your healthcare provider to review this report
- Keep track of key values like blood pressure, glucose, and cholesterol
- Schedule follow-up tests as recommended by your doctor

⚕️ *This is an automated system. Always consult a qualified medical professional.*"""

    def _fallback_chat_response(self, message: str) -> str:
        msg = message.lower()
        if any(w in msg for w in ["headache", "sir dard"]):
            return "Headaches can be caused by dehydration, stress, or lack of sleep. Try drinking water and resting. If severe or persistent, please consult a doctor. 💊"
        if any(w in msg for w in ["fever", "bukhar"]):
            return "For fever above 39°C (102°F), please seek medical attention. Stay hydrated and rest. If it persists more than 2 days, see a doctor. 🌡️"
        if any(w in msg for w in ["diabetes", "sugar", "glucose"]):
            return "Diabetes management involves monitoring blood sugar, following a low-carb diet, regular exercise, and medication as prescribed. Regular HbA1c tests are important. 🩺"
        if any(w in msg for w in ["heart", "chest", "dil"]):
            return "⚠️ For any chest pain or pressure, call emergency services (112) immediately. Heart health requires regular checkups, healthy diet, no smoking, and exercise."
        if any(w in msg for w in ["bp", "blood pressure", "hypertension"]):
            return "Normal blood pressure is below 120/80 mmHg. Reduce salt, exercise regularly, manage stress, and take medications as prescribed. Monitor it daily if you have hypertension. 💉"
        if any(w in msg for w in ["weight", "bmi", "mota"]):
            return "A healthy BMI is 18.5–24.9. Focus on a balanced diet with fruits, vegetables, lean protein, and 150 minutes of exercise per week. Avoid crash diets. 🥗"
        return f"Hello! I'm HealthBot, your AI health assistant. I'm in demo mode (no Gemini API key). For full AI responses, please configure `GEMINI_API_KEY`. \n\nYour question: *{message}*\n\nFor medical emergencies, always call **112**. 🏥"

gemini_service = GeminiService()

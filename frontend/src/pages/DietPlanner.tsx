import React, { useState } from "react";
import { Utensils, Loader2, RefreshCw, ChefHat, Apple, Coffee, Sun, Moon } from "lucide-react";
import toast from "react-hot-toast";
import { api } from "../services/api";

interface MealPlan {
  breakfast: string;
  lunch: string;
  dinner: string;
  snacks: string;
  tips: string;
  calories: string;
  water: string;
}

const CONDITIONS = ["Diabetes", "Hypertension", "Heart Disease", "Obesity", "Thyroid", "PCOD", "Normal/Healthy"];
const GOALS = ["Weight Loss", "Weight Gain", "Muscle Building", "Diabetes Control", "Heart Health", "General Wellness"];
const DIETS = ["Vegetarian", "Non-Vegetarian", "Vegan", "Eggetarian"];

export default function DietPlanner() {
  const [loading, setLoading] = useState(false);
  const [mealPlan, setMealPlan] = useState<MealPlan | null>(null);
  const [form, setForm] = useState({
    age: "", weight: "", height: "", condition: "Normal/Healthy",
    goal: "General Wellness", diet: "Vegetarian", allergies: "",
  });

  const generatePlan = async () => {
    if (!form.age || !form.weight || !form.height) {
      toast.error("Age, weight aur height fill karo!");
      return;
    }
    setLoading(true);
    setMealPlan(null);

    const bmi = (parseFloat(form.weight) / Math.pow(parseFloat(form.height) / 100, 2)).toFixed(1);

    const prompt = `You are an expert Indian nutritionist. Create a detailed personalized daily meal plan.

Patient Details:
- Age: ${form.age} years
- Weight: ${form.weight} kg
- Height: ${form.height} cm
- BMI: ${bmi}
- Medical condition: ${form.condition}
- Goal: ${form.goal}
- Diet preference: ${form.diet}
- Allergies/Avoid: ${form.allergies || "None"}

Create a practical Indian meal plan. Respond ONLY in this exact JSON format:
{
  "breakfast": "Detailed breakfast with portions and timing (7-9 AM)",
  "lunch": "Detailed lunch with portions and timing (1-2 PM)",
  "dinner": "Detailed dinner with portions and timing (7-8 PM)",
  "snacks": "Mid-morning and evening healthy snacks",
  "tips": "3-4 specific diet tips for their condition and goal",
  "calories": "Estimated daily calorie target",
  "water": "Daily water intake recommendation"
}

Use Indian foods. Be specific with quantities. Consider their medical condition seriously.`;

    try {
      const response = await api.post("/chatbot/message", {
        message: prompt,
        session_id: null,
      });

      const text = response.data.response;
      // Extract JSON from response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        setMealPlan(parsed);
        toast.success("Aapka personalized diet plan ready hai! 🥗");
      } else {
        // Parse as text if not JSON
        setMealPlan({
          breakfast: text.includes("Breakfast") ? text.split("Lunch")[0].replace("Breakfast:", "").trim() : "Oats with milk, 2 eggs, 1 banana",
          lunch: "Dal chawal, sabzi, salad, buttermilk",
          dinner: "Roti (2), sabzi, dal, salad",
          snacks: "Morning: Fruits | Evening: Roasted chana or nuts",
          tips: text,
          calories: "1800-2000 kcal",
          water: "8-10 glasses (2.5-3 liters)",
        });
        toast.success("Diet plan ready hai! 🥗");
      }
    } catch (err: any) {
      toast.error("Diet plan generate nahi hua. Backend se connect karo.");
      // Fallback plan
      setMealPlan({
        breakfast: "7-8 AM: Oats porridge (1 bowl) with low-fat milk + 1 banana + Green tea",
        lunch: "1-2 PM: 2 whole wheat roti + Dal (1 bowl) + Mixed vegetable sabzi + Salad + Buttermilk",
        dinner: "7-8 PM: 2 roti + Palak paneer or dal + Salad (light dinner)",
        snacks: "Morning 10-11 AM: 1 fruit (apple/pear) + Evening 4-5 PM: Roasted chana (handful) + Green tea",
        tips: "• Eat every 3-4 hours to maintain blood sugar\n• Avoid processed and fried foods\n• Include protein in every meal\n• Walk 30 minutes daily after lunch/dinner",
        calories: "1800-2000 kcal/day",
        water: "8-10 glasses (2.5-3 liters) daily",
      });
    } finally {
      setLoading(false);
    }
  };

  const MealCard = ({ icon: Icon, title, content, color }: any) => (
    <div className={`bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden`}>
      <div className={`flex items-center gap-3 px-4 py-3 ${color}`}>
        <Icon size={18} className="text-white" />
        <h3 className="text-sm font-semibold text-white">{title}</h3>
      </div>
      <div className="p-4">
        <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">{content}</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <Utensils size={24} className="text-green-600" /> AI Diet Planner
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
          Gemini AI se apna personalized Indian diet plan banao
        </p>
      </div>

      {/* Form */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm p-6">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Apni details bharo:</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          {[
            { label: "Age (years)", key: "age", placeholder: "25" },
            { label: "Weight (kg)", key: "weight", placeholder: "70" },
            { label: "Height (cm)", key: "height", placeholder: "170" },
          ].map(({ label, key, placeholder }) => (
            <div key={key}>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{label}</label>
              <input
                type="number"
                value={(form as any)[key]}
                onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                placeholder={placeholder}
                className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Medical Condition</label>
            <select value={form.condition} onChange={(e) => setForm((f) => ({ ...f, condition: e.target.value }))}
              className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white">
              {CONDITIONS.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Goal</label>
            <select value={form.goal} onChange={(e) => setForm((f) => ({ ...f, goal: e.target.value }))}
              className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white">
              {GOALS.map((g) => <option key={g}>{g}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Diet Type</label>
            <select value={form.diet} onChange={(e) => setForm((f) => ({ ...f, diet: e.target.value }))}
              className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white">
              {DIETS.map((d) => <option key={d}>{d}</option>)}
            </select>
          </div>
        </div>

        <div className="mb-5">
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Allergies / Avoid (optional)</label>
          <input
            type="text"
            value={form.allergies}
            onChange={(e) => setForm((f) => ({ ...f, allergies: e.target.value }))}
            placeholder="e.g. Dairy, Nuts, Gluten..."
            className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
          />
        </div>

        {/* BMI Preview */}
        {form.weight && form.height && (
          <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-3 mb-4 flex items-center gap-3">
            <span className="text-2xl">📊</span>
            <div>
              <p className="text-xs font-medium text-green-700 dark:text-green-400">Your BMI</p>
              <p className="text-lg font-bold text-green-800 dark:text-green-300">
                {(parseFloat(form.weight) / Math.pow(parseFloat(form.height) / 100, 2)).toFixed(1)}
                <span className="text-sm font-normal ml-2">
                  {(() => {
                    const bmi = parseFloat(form.weight) / Math.pow(parseFloat(form.height) / 100, 2);
                    if (bmi < 18.5) return "— Underweight";
                    if (bmi < 25) return "— Normal ✅";
                    if (bmi < 30) return "— Overweight ⚠️";
                    return "— Obese 🚨";
                  })()}
                </span>
              </p>
            </div>
          </div>
        )}

        <button
          onClick={generatePlan}
          disabled={loading}
          className="w-full py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? (
            <><Loader2 size={18} className="animate-spin" /> Gemini AI diet plan bana raha hai...</>
          ) : (
            <><ChefHat size={18} /> Generate My Diet Plan</>
          )}
        </button>
      </div>

      {/* Meal Plan Results */}
      {mealPlan && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">🥗 Aapka Personalized Diet Plan</h2>
            <button onClick={generatePlan} className="flex items-center gap-1.5 text-sm text-green-600 hover:underline">
              <RefreshCw size={14} /> Regenerate
            </button>
          </div>

          {/* Calorie & Water Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl p-4 text-center">
              <p className="text-2xl mb-1">🔥</p>
              <p className="text-sm font-semibold text-orange-700 dark:text-orange-400">Daily Calories</p>
              <p className="text-lg font-bold text-orange-800 dark:text-orange-300">{mealPlan.calories}</p>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 text-center">
              <p className="text-2xl mb-1">💧</p>
              <p className="text-sm font-semibold text-blue-700 dark:text-blue-400">Daily Water</p>
              <p className="text-lg font-bold text-blue-800 dark:text-blue-300">{mealPlan.water}</p>
            </div>
          </div>

          <MealCard icon={Coffee} title="Breakfast — Nashta (7-9 AM)"      content={mealPlan.breakfast} color="bg-yellow-500" />
          <MealCard icon={Sun}    title="Lunch — Dopahar ka Khana (1-2 PM)" content={mealPlan.lunch}      color="bg-orange-500" />
          <MealCard icon={Apple}  title="Snacks — Nashta"                   content={mealPlan.snacks}     color="bg-green-500" />
          <MealCard icon={Moon}   title="Dinner — Raat ka Khana (7-8 PM)"   content={mealPlan.dinner}     color="bg-blue-500" />

          {/* Tips */}
          <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-purple-800 dark:text-purple-300 mb-3 flex items-center gap-2">
              💡 Special Tips for You ({form.condition})
            </h3>
            <p className="text-sm text-purple-700 dark:text-purple-300 leading-relaxed whitespace-pre-line">
              {mealPlan.tips}
            </p>
          </div>

          <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 text-xs text-gray-500 dark:text-gray-400 text-center">
            ⚕️ Yeh AI-generated diet plan hai. Kisi bhi major dietary change se pehle apne doctor ya nutritionist se consult karein.
          </div>
        </div>
      )}
    </div>
  );
}

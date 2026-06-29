import React, { useState } from "react";
import { Brain, Activity, Heart, TrendingUp, AlertCircle, CheckCircle } from "lucide-react";
import toast from "react-hot-toast";
import { predictionsAPI } from "../services/api";
import { Prediction, RiskLevel } from "../types";

const RISK_CONFIG: Record<RiskLevel, { color: string; bg: string; icon: typeof CheckCircle; label: string }> = {
  low:      { color: "text-green-700",  bg: "bg-green-50 border-green-200",  icon: CheckCircle,   label: "Low Risk" },
  moderate: { color: "text-yellow-700", bg: "bg-yellow-50 border-yellow-200", icon: AlertCircle,   label: "Moderate Risk" },
  high:     { color: "text-orange-700", bg: "bg-orange-50 border-orange-200", icon: AlertCircle,   label: "High Risk" },
  critical: { color: "text-red-700",    bg: "bg-red-50 border-red-200",       icon: AlertCircle,   label: "Critical Risk" },
};

const InputField = ({ label, name, value, onChange, min, max, step = "1", unit = "" }: any) => (
  <div>
    <label className="block text-xs font-medium text-gray-600 mb-1">{label}{unit && <span className="text-gray-400 ml-1">({unit})</span>}</label>
    <input
      type="number" name={name} value={value} onChange={onChange}
      min={min} max={max} step={step}
      className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
    />
  </div>
);

function PredictionResult({ result }: { result: Prediction }) {
  const cfg = RISK_CONFIG[result.risk_level];
  const Icon = cfg.icon;
  const pct = Math.round(result.risk_score * 100);

  return (
    <div className={`rounded-xl border p-5 ${cfg.bg}`}>
      <div className="flex items-center gap-3 mb-4">
        <Icon size={22} className={cfg.color} />
        <div>
          <p className={`font-semibold ${cfg.color}`}>{cfg.label}</p>
          <p className="text-xs text-gray-500 capitalize">{result.prediction_type.replace("_", " ")} Prediction</p>
        </div>
        <div className="ml-auto text-right">
          <p className={`text-3xl font-bold ${cfg.color}`}>{pct}%</p>
          <p className="text-xs text-gray-400">Risk Score</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
        <div
          className={`h-2 rounded-full transition-all duration-700 ${
            result.risk_level === "low" ? "bg-green-500" :
            result.risk_level === "moderate" ? "bg-yellow-500" :
            result.risk_level === "high" ? "bg-orange-500" : "bg-red-500"
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>

      <div>
        <p className="text-xs font-semibold text-gray-600 mb-2">Recommendations:</p>
        <ul className="space-y-1">
          {result.recommendations.map((r, i) => (
            <li key={i} className="text-xs text-gray-700 flex gap-2">
              <span className="text-green-500 mt-0.5">•</span>
              <span>{r}</span>
            </li>
          ))}
        </ul>
      </div>

      <p className="text-xs text-gray-400 mt-3">
        Model confidence: {Math.round((result.confidence || 0.85) * 100)}%
      </p>
    </div>
  );
}

type TabType = "diabetes" | "heart" | "general";

export default function Predictions() {
  const [activeTab, setActiveTab] = useState<TabType>("diabetes");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Prediction | null>(null);

  const [diabetesForm, setDiabetesForm] = useState({
    glucose: 120, bmi: 25, age: 35, blood_pressure: 80,
    pregnancies: 0, insulin: 80, diabetes_pedigree: 0.5,
  });

  const [heartForm, setHeartForm] = useState({
    age: 50, sex: 1, chest_pain_type: 0, resting_bp: 120,
    cholesterol: 200, max_heart_rate: 150, exercise_angina: 0, st_depression: 0.0,
  });

  const [generalForm, setGeneralForm] = useState({
    age: 35, blood_pressure_systolic: 120, blood_pressure_diastolic: 80,
    blood_glucose: 90, bmi: 22,
  });

  const handleChange = (setter: any) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setter((prev: any) => ({ ...prev, [e.target.name]: parseFloat(e.target.value) || 0 }));
    setResult(null);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setResult(null);
    try {
      let res;
      if (activeTab === "diabetes")  res = await predictionsAPI.diabetes(diabetesForm);
      else if (activeTab === "heart") res = await predictionsAPI.heartDisease(heartForm);
      else                           res = await predictionsAPI.generalHealth(generalForm);
      setResult(res.data);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Prediction failed.");
    } finally {
      setLoading(false);
    }
  };

  const tabs: { id: TabType; label: string; icon: typeof Brain }[] = [
    { id: "diabetes", label: "Diabetes",     icon: Activity },
    { id: "heart",    label: "Heart Disease", icon: Heart },
    { id: "general",  label: "General Health", icon: TrendingUp },
  ];

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
          <Brain size={24} className="text-blue-600" /> AI Health Predictions
        </h1>
        <p className="text-gray-500 text-sm mt-1">Enter your health data to get AI-powered risk assessment</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-gray-100 p-1 rounded-xl">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => { setActiveTab(id); setResult(null); }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-medium rounded-lg transition-all ${
              activeTab === id ? "bg-white shadow text-blue-600" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <Icon size={15} /> {label}
          </button>
        ))}
      </div>

      {/* Forms */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        {activeTab === "diabetes" && (
          <div className="grid grid-cols-2 gap-4">
            <InputField label="Blood Glucose" name="glucose" value={diabetesForm.glucose} onChange={handleChange(setDiabetesForm)} min={50} max={400} unit="mg/dL" />
            <InputField label="BMI" name="bmi" value={diabetesForm.bmi} onChange={handleChange(setDiabetesForm)} min={10} max={60} step="0.1" />
            <InputField label="Age" name="age" value={diabetesForm.age} onChange={handleChange(setDiabetesForm)} min={1} max={120} />
            <InputField label="Blood Pressure" name="blood_pressure" value={diabetesForm.blood_pressure} onChange={handleChange(setDiabetesForm)} min={40} max={200} unit="mmHg" />
            <InputField label="Pregnancies" name="pregnancies" value={diabetesForm.pregnancies} onChange={handleChange(setDiabetesForm)} min={0} max={20} />
            <InputField label="Insulin" name="insulin" value={diabetesForm.insulin} onChange={handleChange(setDiabetesForm)} min={0} max={900} unit="μU/mL" />
            <InputField label="Diabetes Pedigree" name="diabetes_pedigree" value={diabetesForm.diabetes_pedigree} onChange={handleChange(setDiabetesForm)} min={0} max={2.5} step="0.01" />
          </div>
        )}

        {activeTab === "heart" && (
          <div className="grid grid-cols-2 gap-4">
            <InputField label="Age" name="age" value={heartForm.age} onChange={handleChange(setHeartForm)} min={1} max={120} />
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Sex</label>
              <select name="sex" value={heartForm.sex} onChange={(e) => setHeartForm(p => ({...p, sex: parseInt(e.target.value)}))}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value={1}>Male</option>
                <option value={0}>Female</option>
              </select>
            </div>
            <InputField label="Resting BP" name="resting_bp" value={heartForm.resting_bp} onChange={handleChange(setHeartForm)} min={60} max={250} unit="mmHg" />
            <InputField label="Cholesterol" name="cholesterol" value={heartForm.cholesterol} onChange={handleChange(setHeartForm)} min={100} max={600} unit="mg/dL" />
            <InputField label="Max Heart Rate" name="max_heart_rate" value={heartForm.max_heart_rate} onChange={handleChange(setHeartForm)} min={50} max={220} unit="bpm" />
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Chest Pain Type</label>
              <select name="chest_pain_type" value={heartForm.chest_pain_type} onChange={(e) => setHeartForm(p => ({...p, chest_pain_type: parseInt(e.target.value)}))}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value={0}>Typical Angina</option>
                <option value={1}>Atypical Angina</option>
                <option value={2}>Non-anginal Pain</option>
                <option value={3}>Asymptomatic</option>
              </select>
            </div>
            <InputField label="ST Depression" name="st_depression" value={heartForm.st_depression} onChange={handleChange(setHeartForm)} min={0} max={10} step="0.1" />
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Exercise Angina</label>
              <select name="exercise_angina" value={heartForm.exercise_angina} onChange={(e) => setHeartForm(p => ({...p, exercise_angina: parseInt(e.target.value)}))}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value={0}>No</option>
                <option value={1}>Yes</option>
              </select>
            </div>
          </div>
        )}

        {activeTab === "general" && (
          <div className="grid grid-cols-2 gap-4">
            <InputField label="Age" name="age" value={generalForm.age} onChange={handleChange(setGeneralForm)} min={1} max={120} />
            <InputField label="BMI" name="bmi" value={generalForm.bmi} onChange={handleChange(setGeneralForm)} min={10} max={60} step="0.1" />
            <InputField label="Systolic BP" name="blood_pressure_systolic" value={generalForm.blood_pressure_systolic} onChange={handleChange(setGeneralForm)} min={60} max={250} unit="mmHg" />
            <InputField label="Diastolic BP" name="blood_pressure_diastolic" value={generalForm.blood_pressure_diastolic} onChange={handleChange(setGeneralForm)} min={40} max={150} unit="mmHg" />
            <InputField label="Blood Glucose" name="blood_glucose" value={generalForm.blood_glucose} onChange={handleChange(setGeneralForm)} min={50} max={400} unit="mg/dL" />
          </div>
        )}

        <button
          onClick={handleSubmit} disabled={loading}
          className="mt-6 w-full py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? (
            <><svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg> Analyzing...</>
          ) : (
            <><Brain size={16} /> Run AI Prediction</>
          )}
        </button>
      </div>

      {result && <PredictionResult result={result} />}

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-700">
        <strong>Disclaimer:</strong> These predictions are AI-generated and for informational purposes only. Always consult a qualified healthcare professional for medical advice and diagnosis.
      </div>
    </div>
  );
}

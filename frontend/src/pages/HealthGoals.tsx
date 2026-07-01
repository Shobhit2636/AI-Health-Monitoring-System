import React, { useState, useEffect } from "react";
import { Target, Plus, Trophy, Droplets, Footprints, Moon, Dumbbell, X, CheckCircle } from "lucide-react";
import toast from "react-hot-toast";

interface Goal {
  id: string;
  type: string;
  title: string;
  target: number;
  current: number;
  unit: string;
  icon: string;
  color: string;
  deadline: string;
}

const PRESET_GOALS = [
  { type: "water",    title: "Daily Water Intake",  target: 8,    unit: "glasses", icon: "💧", color: "blue" },
  { type: "steps",    title: "Daily Steps",          target: 10000, unit: "steps",   icon: "👟", color: "green" },
  { type: "sleep",    title: "Sleep Hours",           target: 8,    unit: "hours",   icon: "😴", color: "purple" },
  { type: "exercise", title: "Exercise Minutes",      target: 30,   unit: "minutes", icon: "💪", color: "orange" },
  { type: "weight",   title: "Target Weight",         target: 70,   unit: "kg",      icon: "⚖️", color: "red" },
  { type: "glucose",  title: "Blood Glucose Control", target: 100,  unit: "mg/dL",   icon: "🩸", color: "pink" },
];

const COLOR_MAP: Record<string, { bg: string; text: string; bar: string; light: string }> = {
  blue:   { bg: "bg-blue-50",   text: "text-blue-700",   bar: "bg-blue-500",   light: "bg-blue-100" },
  green:  { bg: "bg-green-50",  text: "text-green-700",  bar: "bg-green-500",  light: "bg-green-100" },
  purple: { bg: "bg-purple-50", text: "text-purple-700", bar: "bg-purple-500", light: "bg-purple-100" },
  orange: { bg: "bg-orange-50", text: "text-orange-700", bar: "bg-orange-500", light: "bg-orange-100" },
  red:    { bg: "bg-red-50",    text: "text-red-700",    bar: "bg-red-500",    light: "bg-red-100" },
  pink:   { bg: "bg-pink-50",   text: "text-pink-700",   bar: "bg-pink-500",   light: "bg-pink-100" },
};

export default function HealthGoals() {
  const [goals, setGoals] = useState<Goal[]>(() => {
    const saved = localStorage.getItem("health_goals");
    return saved ? JSON.parse(saved) : [];
  });
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState<typeof PRESET_GOALS[0] | null>(null);
  const [customTarget, setCustomTarget] = useState("");
  const [deadline, setDeadline] = useState("");

  useEffect(() => {
    localStorage.setItem("health_goals", JSON.stringify(goals));
  }, [goals]);

  const addGoal = () => {
    if (!selected) return;
    const goal: Goal = {
      id: Date.now().toString(),
      type: selected.type,
      title: selected.title,
      target: parseFloat(customTarget) || selected.target,
      current: 0,
      unit: selected.unit,
      icon: selected.icon,
      color: selected.color,
      deadline,
    };
    setGoals((prev) => [...prev, goal]);
    setShowForm(false);
    setSelected(null);
    setCustomTarget("");
    toast.success(`Goal add ho gaya: ${goal.title} 🎯`);
  };

  const updateProgress = (id: string, value: number) => {
    setGoals((prev) =>
      prev.map((g) => {
        if (g.id !== id) return g;
        const newCurrent = Math.min(Math.max(0, g.current + value), g.target * 1.5);
        if (newCurrent >= g.target && g.current < g.target) {
          toast.success(`🎉 Goal achieve ho gaya: ${g.title}!`);
        }
        return { ...g, current: newCurrent };
      })
    );
  };

  const deleteGoal = (id: string) => {
    setGoals((prev) => prev.filter((g) => g.id !== id));
    toast.success("Goal delete ho gaya");
  };

  const completedGoals = goals.filter((g) => g.current >= g.target).length;

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Target size={24} className="text-green-600" /> Health Goals
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Apne health targets track karo</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-green-600 text-white text-sm font-medium rounded-xl hover:bg-green-700 transition-all"
        >
          <Plus size={16} /> Add Goal
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Goals",     value: goals.length,    icon: "🎯", color: "bg-blue-50 text-blue-700" },
          { label: "Completed Today", value: completedGoals,  icon: "✅", color: "bg-green-50 text-green-700" },
          { label: "In Progress",     value: goals.length - completedGoals, icon: "⏳", color: "bg-yellow-50 text-yellow-700" },
        ].map((s) => (
          <div key={s.label} className={`rounded-xl p-4 text-center ${s.color} border border-opacity-20`}>
            <p className="text-2xl mb-1">{s.icon}</p>
            <p className="text-2xl font-bold">{s.value}</p>
            <p className="text-xs font-medium">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Add Goal Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-700">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white">New Health Goal</h2>
              <button onClick={() => setShowForm(false)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500"><X size={16} /></button>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Goal select karo:</p>
              <div className="grid grid-cols-2 gap-2">
                {PRESET_GOALS.map((g) => (
                  <button
                    key={g.type}
                    onClick={() => { setSelected(g); setCustomTarget(g.target.toString()); }}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      selected?.type === g.type
                        ? "border-green-500 bg-green-50"
                        : "border-gray-200 hover:border-green-300 dark:border-gray-600 dark:bg-gray-700"
                    }`}
                  >
                    <span className="text-xl">{g.icon}</span>
                    <p className="text-xs font-medium text-gray-900 dark:text-white mt-1">{g.title}</p>
                    <p className="text-xs text-gray-400">{g.target} {g.unit}</p>
                  </button>
                ))}
              </div>
              {selected && (
                <>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Target ({selected.unit})</label>
                    <input type="number" value={customTarget} onChange={(e) => setCustomTarget(e.target.value)}
                      className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Deadline (optional)</label>
                    <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)}
                      className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white" />
                  </div>
                </>
              )}
            </div>
            <div className="p-5 border-t border-gray-100 dark:border-gray-700 flex gap-3">
              <button onClick={() => setShowForm(false)} className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm hover:bg-gray-50">Cancel</button>
              <button onClick={addGoal} disabled={!selected} className="flex-1 py-2.5 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700 disabled:opacity-50">Add Goal</button>
            </div>
          </div>
        </div>
      )}

      {/* Goals List */}
      {goals.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
          <Trophy size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 dark:text-gray-400 font-medium">Koi goal set nahi kiya</p>
          <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">+ Add Goal dabao apna pehla goal set karne ke liye</p>
        </div>
      ) : (
        <div className="space-y-4">
          {goals.map((goal) => {
            const pct = Math.min(Math.round((goal.current / goal.target) * 100), 100);
            const c = COLOR_MAP[goal.color] || COLOR_MAP.blue;
            const achieved = goal.current >= goal.target;
            return (
              <div key={goal.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{goal.icon}</span>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        {goal.title}
                        {achieved && <CheckCircle size={16} className="text-green-500" />}
                      </p>
                      <p className="text-xs text-gray-400">
                        {goal.current} / {goal.target} {goal.unit}
                        {goal.deadline && ` • Deadline: ${new Date(goal.deadline).toLocaleDateString()}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-bold ${c.text}`}>{pct}%</span>
                    <button onClick={() => deleteGoal(goal.id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg">
                      <X size={14} />
                    </button>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className={`w-full ${c.light} rounded-full h-3 mb-4`}>
                  <div
                    className={`${c.bar} h-3 rounded-full transition-all duration-500`}
                    style={{ width: `${pct}%` }}
                  />
                </div>

                {/* Quick Add Buttons */}
                <div className="flex gap-2 flex-wrap">
                  {[1, 5, 10].map((val) => (
                    <button
                      key={val}
                      onClick={() => updateProgress(goal.id, val)}
                      className={`px-3 py-1.5 ${c.bg} ${c.text} text-xs font-medium rounded-lg hover:opacity-80 transition-all`}
                    >
                      +{val} {goal.unit}
                    </button>
                  ))}
                  {goal.current > 0 && (
                    <button
                      onClick={() => updateProgress(goal.id, -1)}
                      className="px-3 py-1.5 bg-gray-100 text-gray-600 text-xs font-medium rounded-lg hover:bg-gray-200"
                    >
                      -1
                    </button>
                  )}
                  {achieved && (
                    <span className="px-3 py-1.5 bg-green-100 text-green-700 text-xs font-medium rounded-lg">
                      🎉 Goal Achieved!
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

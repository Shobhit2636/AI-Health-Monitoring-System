import React, { useState, useEffect } from "react";
import { Pill, Plus, Trash2, Clock, CheckCircle, Bell, X } from "lucide-react";
import toast from "react-hot-toast";

interface Medicine {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  times: string[];
  startDate: string;
  endDate: string;
  notes: string;
  color: string;
  takenToday: boolean[];
}

const COLORS = [
  "bg-blue-500", "bg-green-500", "bg-purple-500",
  "bg-red-500", "bg-yellow-500", "bg-pink-500", "bg-indigo-500",
];

const FREQUENCIES = [
  { label: "Once daily", times: ["08:00"] },
  { label: "Twice daily", times: ["08:00", "20:00"] },
  { label: "Three times daily", times: ["08:00", "14:00", "20:00"] },
  { label: "Four times daily", times: ["08:00", "12:00", "16:00", "20:00"] },
  { label: "Every night", times: ["22:00"] },
  { label: "As needed", times: [] },
];

export default function MedicineReminder() {
  const [medicines, setMedicines] = useState<Medicine[]>(() => {
    const saved = localStorage.getItem("medicines");
    return saved ? JSON.parse(saved) : [];
  });
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: "", dosage: "", frequency: "Once daily",
    times: ["08:00"], startDate: new Date().toISOString().split("T")[0],
    endDate: "", notes: "", color: "bg-blue-500",
  });

  useEffect(() => {
    localStorage.setItem("medicines", JSON.stringify(medicines));
  }, [medicines]);

  const handleFrequencyChange = (freq: string) => {
    const found = FREQUENCIES.find((f) => f.label === freq);
    setForm((f) => ({ ...f, frequency: freq, times: found?.times || [] }));
  };

  const addMedicine = () => {
    if (!form.name || !form.dosage) {
      toast.error("Medicine name aur dosage required hai!");
      return;
    }
    const med: Medicine = {
      id: Date.now().toString(),
      ...form,
      takenToday: new Array(form.times.length).fill(false),
    };
    setMedicines((prev) => [...prev, med]);
    setShowForm(false);
    setForm({ name: "", dosage: "", frequency: "Once daily", times: ["08:00"], startDate: new Date().toISOString().split("T")[0], endDate: "", notes: "", color: "bg-blue-500" });
    toast.success(`${med.name} reminder add ho gaya! 💊`);
  };

  const deleteMedicine = (id: string) => {
    setMedicines((prev) => prev.filter((m) => m.id !== id));
    toast.success("Medicine reminder delete ho gaya");
  };

  const markTaken = (medId: string, timeIndex: number) => {
    setMedicines((prev) =>
      prev.map((m) => {
        if (m.id !== medId) return m;
        const takenToday = [...m.takenToday];
        takenToday[timeIndex] = !takenToday[timeIndex];
        return { ...m, takenToday };
      })
    );
    toast.success("Medicine mark ho gaya! ✅");
  };

  const totalToday = medicines.reduce((acc, m) => acc + m.times.length, 0);
  const takenToday = medicines.reduce((acc, m) => acc + m.takenToday.filter(Boolean).length, 0);
  const adherence = totalToday > 0 ? Math.round((takenToday / totalToday) * 100) : 0;

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Pill size={24} className="text-blue-600" /> Medicine Reminders
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Apni dawai ka schedule manage karo</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition-all"
        >
          <Plus size={16} /> Add Medicine
        </button>
      </div>

      {/* Today's Progress */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-5 text-white">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-blue-100 text-sm">Aaj ka progress</p>
            <p className="text-3xl font-bold">{takenToday}/{totalToday}</p>
            <p className="text-blue-200 text-xs">medicines li gayi</p>
          </div>
          <div className="text-right">
            <p className="text-5xl font-bold">{adherence}%</p>
            <p className="text-blue-200 text-sm">adherence</p>
          </div>
        </div>
        <div className="w-full bg-blue-500/40 rounded-full h-2.5">
          <div
            className="bg-white h-2.5 rounded-full transition-all duration-500"
            style={{ width: `${adherence}%` }}
          />
        </div>
      </div>

      {/* Add Medicine Form */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-700">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white">New Medicine</h2>
              <button onClick={() => setShowForm(false)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-500">
                <X size={16} />
              </button>
            </div>
            <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Medicine Name *</label>
                <input
                  value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Metformin, Amlodipine..."
                  className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Dosage *</label>
                <input
                  value={form.dosage} onChange={(e) => setForm((f) => ({ ...f, dosage: e.target.value }))}
                  placeholder="e.g. 500mg, 1 tablet..."
                  className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Frequency</label>
                <select
                  value={form.frequency} onChange={(e) => handleFrequencyChange(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  {FREQUENCIES.map((f) => <option key={f.label}>{f.label}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Start Date</label>
                  <input type="date" value={form.startDate} onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">End Date</label>
                  <input type="date" value={form.endDate} onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Notes</label>
                <textarea value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  placeholder="Khane ke baad lena hai..." rows={2}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white resize-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">Color</label>
                <div className="flex gap-2">
                  {COLORS.map((c) => (
                    <button key={c} onClick={() => setForm((f) => ({ ...f, color: c }))}
                      className={`w-7 h-7 rounded-full ${c} ${form.color === c ? "ring-2 ring-offset-2 ring-gray-400" : ""}`} />
                  ))}
                </div>
              </div>
            </div>
            <div className="p-5 border-t border-gray-100 dark:border-gray-700 flex gap-3">
              <button onClick={() => setShowForm(false)} className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm hover:bg-gray-50">Cancel</button>
              <button onClick={addMedicine} className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700">Add Medicine</button>
            </div>
          </div>
        </div>
      )}

      {/* Medicine List */}
      {medicines.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
          <Pill size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 dark:text-gray-400 font-medium">Koi medicine add nahi ki</p>
          <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">+ Add Medicine button dabao</p>
        </div>
      ) : (
        <div className="space-y-4">
          {medicines.map((med) => (
            <div key={med.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
              <div className="flex items-center gap-4 p-4">
                <div className={`w-12 h-12 ${med.color} rounded-xl flex items-center justify-center flex-shrink-0`}>
                  <Pill size={22} className="text-white" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900 dark:text-white">{med.name}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{med.dosage} • {med.frequency}</p>
                  {med.notes && <p className="text-xs text-gray-400 mt-0.5">{med.notes}</p>}
                </div>
                <button onClick={() => deleteMedicine(med.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all">
                  <Trash2 size={16} />
                </button>
              </div>
              {med.times.length > 0 && (
                <div className="px-4 pb-4 flex flex-wrap gap-2">
                  {med.times.map((time, idx) => (
                    <button
                      key={idx}
                      onClick={() => markTaken(med.id, idx)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        med.takenToday[idx]
                          ? "bg-green-100 text-green-700 border border-green-200"
                          : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600 hover:bg-blue-50 hover:text-blue-600"
                      }`}
                    >
                      {med.takenToday[idx] ? <CheckCircle size={12} /> : <Clock size={12} />}
                      {time} {med.takenToday[idx] ? "✓ Li" : "Lena hai"}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

import React, { useState, useEffect } from "react";
import { Activity, Plus } from "lucide-react";
import { Line } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from "chart.js";
import toast from "react-hot-toast";
import { healthAPI } from "../services/api";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const FIELDS = [
  { name: "blood_pressure_systolic",  label: "Systolic BP",  unit: "mmHg" },
  { name: "blood_pressure_diastolic", label: "Diastolic BP", unit: "mmHg" },
  { name: "heart_rate",               label: "Heart Rate",   unit: "bpm" },
  { name: "blood_glucose",            label: "Blood Glucose",unit: "mg/dL" },
  { name: "cholesterol_total",        label: "Cholesterol",  unit: "mg/dL" },
  { name: "oxygen_saturation",        label: "SpO2",         unit: "%" },
  { name: "temperature",              label: "Temperature",  unit: "°C" },
  { name: "hba1c",                    label: "HbA1c",        unit: "%" },
];

export default function HealthRecords() {
  const [records, setRecords]   = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading]   = useState(false);
  const emptyForm = Object.fromEntries([...FIELDS.map(f => [f.name, ""]), ["notes", ""]]);
  const [form, setForm]         = useState<Record<string, string>>(emptyForm);

  const fetchRecords = async () => {
    try { const r = await healthAPI.getRecords(30); setRecords(r.data); } catch {}
  };

  useEffect(() => { fetchRecords(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const payload: Record<string, any> = {};
    Object.entries(form).forEach(([k, v]) => {
      if (v !== "") payload[k] = k === "notes" ? v : parseFloat(v);
    });
    try {
      await healthAPI.createRecord(payload);
      toast.success("Health record saved! ✅");
      setForm(emptyForm);
      setShowForm(false);
      await fetchRecords();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to save.");
    } finally { setLoading(false); }
  };

  const labels  = records.slice().reverse().map((r) => new Date(r.recorded_at).toLocaleDateString("en", { month: "short", day: "numeric" }));
  const latest  = records[0];

  const chartOpts = {
    responsive: true,
    plugins: { legend: { position: "bottom" as const, labels: { boxWidth: 10, font: { size: 11 } } } },
    scales: { x: { grid: { display: false } }, y: { grid: { color: "#f3f4f6" } } },
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Activity size={24} className="text-blue-600" /> Health Records
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Apne vitals track karo</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition-all">
          <Plus size={16} /> Add Record
        </button>
      </div>

      {/* Add Form */}
      {showForm && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm p-6">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">New Health Record</h2>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              {FIELDS.map(({ name, label, unit }) => (
                <div key={name}>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    {label} <span className="text-gray-400">({unit})</span>
                  </label>
                  <input type="number" name={name} value={form[name]}
                    onChange={(e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }))}
                    step="0.1" placeholder="—"
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
                </div>
              ))}
            </div>
            <textarea name="notes" value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              placeholder="Notes (optional)..."
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white resize-none mb-4"
              rows={2} />
            <div className="flex gap-3">
              <button type="submit" disabled={loading}
                className="px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 disabled:opacity-50">
                {loading ? "Saving..." : "Save Record"}
              </button>
              <button type="button" onClick={() => setShowForm(false)}
                className="px-5 py-2.5 text-gray-600 dark:text-gray-400 text-sm font-medium rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Latest Vitals */}
      {latest && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Blood Pressure", value: latest.blood_pressure, unit: "mmHg", color: "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-100 dark:border-red-900" },
            { label: "Heart Rate",     value: latest.heart_rate,     unit: "bpm",  color: "bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 border-purple-100 dark:border-purple-900" },
            { label: "Blood Glucose",  value: latest.blood_glucose,  unit: "mg/dL",color: "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-100 dark:border-green-900" },
            { label: "SpO2",           value: latest.oxygen_saturation, unit: "%", color: "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border-blue-100 dark:border-blue-900" },
          ].map((v) => (
            <div key={v.label} className={`rounded-xl p-4 border ${v.color}`}>
              <p className="text-xs font-medium mb-1">{v.label}</p>
              <p className="text-xl font-bold">{v.value ?? "—"}</p>
              <p className="text-xs opacity-70">{v.unit}</p>
            </div>
          ))}
        </div>
      )}

      {/* Charts */}
      {records.length > 1 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm p-5">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">Blood Pressure Trend</h3>
            <Line data={{ labels, datasets: [
              { label: "Systolic",  data: records.slice().reverse().map((r) => r.blood_pressure?.split("/")[0]), borderColor: "#ef4444", tension: 0.4 },
              { label: "Diastolic", data: records.slice().reverse().map((r) => r.blood_pressure?.split("/")[1]), borderColor: "#3b82f6", tension: 0.4 },
            ]}} options={chartOpts} />
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm p-5">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">Blood Glucose Trend</h3>
            <Line data={{ labels, datasets: [{ label: "Glucose", data: records.slice().reverse().map((r) => r.blood_glucose), borderColor: "#10b981", backgroundColor: "rgba(16,185,129,0.1)", tension: 0.4, fill: true }]}} options={chartOpts} />
          </div>
        </div>
      )}

      {/* Records Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-700">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">History ({records.length} records)</h2>
        </div>
        {records.length === 0 ? (
          <p className="text-center py-10 text-gray-400 text-sm">No records yet. Add your first reading above.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>{["Date","BP","Heart Rate","Glucose","SpO2","Temp","Notes"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                {records.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300 whitespace-nowrap">{new Date(r.recorded_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{r.blood_pressure ?? "—"}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{r.heart_rate ?? "—"}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{r.blood_glucose ?? "—"}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{r.oxygen_saturation ?? "—"}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{r.temperature ?? "—"}</td>
                    <td className="px-4 py-3 text-gray-400 dark:text-gray-500 max-w-xs truncate">{r.notes ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

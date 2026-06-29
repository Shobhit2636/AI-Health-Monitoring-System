import React, { useState, useEffect } from "react";
import { Activity, Plus, TrendingUp, Droplets, Heart, Thermometer } from "lucide-react";
import { Line } from "react-chartjs-2";
import toast from "react-hot-toast";
import { healthAPI } from "../services/api";
import { HealthRecord } from "../types";

const chartOptions = {
  responsive: true,
  plugins: { legend: { display: false } },
  scales: { y: { beginAtZero: false }, x: { grid: { display: false } } },
};

const VitalCard = ({ icon: Icon, label, value, unit, color }: any) => (
  <div className={`rounded-xl p-4 border ${color}`}>
    <div className="flex items-center gap-2 mb-1">
      <Icon size={15} />
      <span className="text-xs font-medium">{label}</span>
    </div>
    <p className="text-xl font-bold">{value ?? "—"}</p>
    {unit && <p className="text-xs opacity-70">{unit}</p>}
  </div>
);

export default function HealthRecords() {
  const [records, setRecords] = useState<HealthRecord[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    blood_pressure_systolic: "", blood_pressure_diastolic: "",
    heart_rate: "", blood_glucose: "", cholesterol_total: "",
    oxygen_saturation: "", temperature: "", hba1c: "", notes: "",
  });

  const fetchRecords = async () => {
    try {
      const r = await healthAPI.getRecords(30);
      setRecords(r.data);
    } catch {}
  };

  useEffect(() => { fetchRecords(); }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const payload: any = {};
    Object.entries(form).forEach(([k, v]) => {
      if (v !== "") payload[k] = k === "notes" ? v : parseFloat(v as string);
    });
    try {
      await healthAPI.createRecord(payload);
      toast.success("Health record saved!");
      setForm({ blood_pressure_systolic: "", blood_pressure_diastolic: "", heart_rate: "", blood_glucose: "", cholesterol_total: "", oxygen_saturation: "", temperature: "", hba1c: "", notes: "" });
      setShowForm(false);
      await fetchRecords();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to save record.");
    } finally {
      setLoading(false);
    }
  };

  const latest = records[0];
  const labels = records.slice().reverse().map((r) => new Date(r.recorded_at).toLocaleDateString("en", { month: "short", day: "numeric" }));

  const bpData = {
    labels,
    datasets: [
      { label: "Systolic", data: records.slice().reverse().map((r) => r.blood_pressure?.split("/")[0]), borderColor: "#ef4444", tension: 0.4 },
      { label: "Diastolic", data: records.slice().reverse().map((r) => r.blood_pressure?.split("/")[1]), borderColor: "#3b82f6", tension: 0.4 },
    ],
  };

  const glucoseData = {
    labels,
    datasets: [{ data: records.slice().reverse().map((r) => r.blood_glucose), borderColor: "#10b981", backgroundColor: "#d1fae5", tension: 0.4, fill: true }],
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
            <Activity size={24} className="text-blue-600" /> Health Records
          </h1>
          <p className="text-gray-500 text-sm mt-1">Track your vitals over time</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition-all"
        >
          <Plus size={16} /> Add Record
        </button>
      </div>

      {/* Add Record Form */}
      {showForm && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">New Health Record</h2>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
              {[
                { name: "blood_pressure_systolic", label: "Systolic BP", unit: "mmHg" },
                { name: "blood_pressure_diastolic", label: "Diastolic BP", unit: "mmHg" },
                { name: "heart_rate", label: "Heart Rate", unit: "bpm" },
                { name: "blood_glucose", label: "Blood Glucose", unit: "mg/dL" },
                { name: "cholesterol_total", label: "Cholesterol", unit: "mg/dL" },
                { name: "oxygen_saturation", label: "SpO2", unit: "%" },
                { name: "temperature", label: "Temperature", unit: "°C" },
                { name: "hba1c", label: "HbA1c", unit: "%" },
              ].map(({ name, label, unit }) => (
                <div key={name}>
                  <label className="block text-xs font-medium text-gray-600 mb-1">{label} <span className="text-gray-400">({unit})</span></label>
                  <input
                    type="number" name={name} value={(form as any)[name]}
                    onChange={handleChange} step="0.1"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="—"
                  />
                </div>
              ))}
            </div>
            <textarea
              name="notes" value={form.notes} onChange={handleChange}
              placeholder="Notes (optional)..."
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none mb-4"
              rows={2}
            />
            <div className="flex gap-3">
              <button type="submit" disabled={loading}
                className="px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-all">
                {loading ? "Saving..." : "Save Record"}
              </button>
              <button type="button" onClick={() => setShowForm(false)}
                className="px-5 py-2.5 text-gray-600 text-sm font-medium rounded-xl hover:bg-gray-100 transition-all">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Latest Vitals */}
      {latest && (
        <div>
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Latest Readings</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <VitalCard icon={Heart}       label="Blood Pressure" value={latest.blood_pressure}     unit="mmHg" color="text-red-700 bg-red-50 border-red-100" />
            <VitalCard icon={Activity}    label="Heart Rate"     value={latest.heart_rate}          unit="bpm"  color="text-purple-700 bg-purple-50 border-purple-100" />
            <VitalCard icon={Droplets}    label="Blood Glucose"  value={latest.blood_glucose}       unit="mg/dL" color="text-green-700 bg-green-50 border-green-100" />
            <VitalCard icon={Thermometer} label="Temperature"    value={latest.temperature}         unit="°C"   color="text-orange-700 bg-orange-50 border-orange-100" />
          </div>
        </div>
      )}

      {/* Charts */}
      {records.length > 1 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h3 className="text-sm font-medium text-gray-700 mb-4">Blood Pressure Trend</h3>
            <Line data={bpData} options={{ ...chartOptions, plugins: { legend: { position: "bottom" as const, display: true } } }} />
          </div>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h3 className="text-sm font-medium text-gray-700 mb-4">Blood Glucose Trend</h3>
            <Line data={glucoseData} options={chartOptions} />
          </div>
        </div>
      )}

      {/* Records table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-700">History ({records.length} records)</h2>
        </div>
        {records.length === 0 ? (
          <p className="text-center py-10 text-gray-400 text-sm">No records yet. Add your first reading above.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {["Date", "BP (mmHg)", "Heart Rate", "Glucose", "SpO2", "Temp", "Notes"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {records.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{new Date(r.recorded_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{r.blood_pressure ?? "—"}</td>
                    <td className="px-4 py-3 text-gray-600">{r.heart_rate ?? "—"}</td>
                    <td className="px-4 py-3 text-gray-600">{r.blood_glucose ?? "—"}</td>
                    <td className="px-4 py-3 text-gray-600">{r.oxygen_saturation ?? "—"}</td>
                    <td className="px-4 py-3 text-gray-600">{r.temperature ?? "—"}</td>
                    <td className="px-4 py-3 text-gray-400 max-w-xs truncate">{r.notes ?? "—"}</td>
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

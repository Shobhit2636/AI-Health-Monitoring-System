import React, { useEffect, useState } from "react";
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  LineElement, BarElement, Title, Tooltip, Legend, ArcElement,
} from "chart.js";
import { Line, Bar, Doughnut } from "react-chartjs-2";
import { Activity, Brain, Bell, FileText, AlertCircle, ArrowUp, ArrowDown } from "lucide-react";
import { dashboardAPI } from "../services/api";
import { useAuthStore } from "../store/authStore";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, ArcElement);

const RISK_COLORS: Record<string, string> = {
  low:      "text-green-600 bg-green-50 border-green-200",
  moderate: "text-yellow-600 bg-yellow-50 border-yellow-200",
  high:     "text-orange-600 bg-orange-50 border-orange-200",
  critical: "text-red-600 bg-red-50 border-red-200",
};

const RiskBadge = ({ level }: { level: string }) => (
  <span className={`px-2 py-0.5 rounded-full text-xs font-medium border capitalize ${RISK_COLORS[level] || RISK_COLORS.low}`}>{level}</span>
);

const StatCard = ({ icon: Icon, label, value, color, sub }: any) => (
  <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-4">
    <div className={`p-3 rounded-xl ${color} flex-shrink-0`}><Icon size={22} className="text-white" /></div>
    <div>
      <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
      <p className="text-2xl font-bold text-gray-900 dark:text-white">{value ?? "0"}</p>
      {sub && <p className="text-xs text-gray-400">{sub}</p>}
    </div>
  </div>
);

function HealthScoreGauge({ score }: { score: number }) {
  const color = score >= 80 ? "#10b981" : score >= 60 ? "#f59e0b" : "#ef4444";
  const label = score >= 80 ? "Excellent" : score >= 60 ? "Good" : "Needs Attention";
  const doughnutData = {
    datasets: [{ data: [score, 100 - score], backgroundColor: [color, "#f3f4f6"], borderWidth: 0, circumference: 180, rotation: 270 }],
  };
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm text-center">
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Overall Health Score</h3>
      <div className="relative w-40 h-24 mx-auto">
        <Doughnut data={doughnutData} options={{ plugins: { legend: { display: false } }, cutout: "75%" }} />
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-2">
          <p className="text-3xl font-bold" style={{ color }}>{score}</p>
          <p className="text-xs font-medium" style={{ color }}>{label}</p>
        </div>
      </div>
      <div className="flex justify-between text-xs text-gray-400 mt-1 px-4"><span>0</span><span>100</span></div>
    </div>
  );
}

function VitalsStatus({ vitals }: { vitals: any }) {
  const items = [
    { label: "Blood Pressure", value: vitals?.blood_pressure, unit: "mmHg",
      status: !vitals?.blood_pressure ? "unknown" : (parseInt(vitals.blood_pressure) < 120 ? "normal" : parseInt(vitals.blood_pressure) < 130 ? "elevated" : "high") },
    { label: "Blood Glucose",  value: vitals?.glucose ? `${vitals.glucose}` : null, unit: "mg/dL",
      status: !vitals?.glucose ? "unknown" : (vitals.glucose < 100 ? "normal" : vitals.glucose < 140 ? "elevated" : "high") },
    { label: "Heart Rate",     value: vitals?.heart_rate ? `${vitals.heart_rate}` : null, unit: "bpm",
      status: !vitals?.heart_rate ? "unknown" : (vitals.heart_rate >= 60 && vitals.heart_rate <= 100 ? "normal" : "abnormal") },
  ];
  const s: Record<string, string> = {
    normal:   "bg-green-50 text-green-700 border-green-200",
    elevated: "bg-yellow-50 text-yellow-700 border-yellow-200",
    high:     "bg-orange-50 text-orange-700 border-orange-200",
    critical: "bg-red-50 text-red-700 border-red-200",
    abnormal: "bg-red-50 text-red-700 border-red-200",
    unknown:  "bg-gray-50 text-gray-500 border-gray-200",
  };
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Vitals Status</h3>
      <div className="space-y-3">
        {items.map((c) => (
          <div key={c.label} className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">{c.label}</span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-900 dark:text-white">{c.value ? `${c.value} ${c.unit}` : "—"}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full border capitalize ${s[c.status]}`}>{c.status}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuthStore();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    dashboardAPI.patient()
      .then((res) => { setData(res.data); setError(null); })
      .catch(() => {
        setError("Backend se connect nahi hua.");
        setData({ summary: { total_records: 0, total_reports: 0, unread_notifications: 0, active_predictions: 0 }, vitals_timeline: [], recent_predictions: [], latest_vitals: {} });
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <div className="animate-spin w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-3" />
        <p className="text-gray-500 text-sm">Loading dashboard...</p>
      </div>
    </div>
  );

  const vitals = data?.vitals_timeline || [];
  const labels = vitals.map((v: any) => v.date?.slice(5) || "");

  const healthScore = (() => {
    let score = 85;
    if (data?.latest_vitals?.blood_pressure) {
      const sys = parseInt(data.latest_vitals.blood_pressure);
      if (sys > 140) score -= 20; else if (sys > 130) score -= 10;
    }
    if (data?.latest_vitals?.glucose > 140) score -= 20;
    else if (data?.latest_vitals?.glucose > 100) score -= 10;
    return Math.max(score, 0);
  })();

  const chartOpts = {
    responsive: true,
    plugins: { legend: { position: "bottom" as const, labels: { boxWidth: 10, font: { size: 11 } } } },
    scales: { x: { grid: { display: false }, ticks: { font: { size: 10 } } }, y: { grid: { color: "#f3f4f6" }, ticks: { font: { size: 10 } } } },
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Namaste, {user?.name?.split(" ")[0] || "User"} 👋</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-400">Health Score</p>
          <p className={`text-3xl font-bold ${healthScore >= 80 ? "text-green-600" : healthScore >= 60 ? "text-yellow-600" : "text-red-600"}`}>
            {healthScore}<span className="text-sm font-normal text-gray-400">/100</span>
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle size={18} className="text-yellow-600 flex-shrink-0" />
          <p className="text-sm text-yellow-700">{error}</p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Activity} label="Health Records"  value={data?.summary?.total_records}        color="bg-blue-500"   sub="Total vitals" />
        <StatCard icon={FileText} label="Medical Reports" value={data?.summary?.total_reports}        color="bg-purple-500" sub="Uploaded" />
        <StatCard icon={Brain}    label="AI Predictions"  value={data?.summary?.active_predictions}   color="bg-green-500"  sub="Risk checks" />
        <StatCard icon={Bell}     label="Notifications"   value={data?.summary?.unread_notifications} color="bg-amber-500"  sub="Unread" />
      </div>

      {/* Health Score + Vitals */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <HealthScoreGauge score={healthScore} />
        <VitalsStatus vitals={data?.latest_vitals} />
      </div>

      {/* Vitals Banner */}
      {data?.latest_vitals?.blood_pressure ? (
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-5 text-white">
          <p className="text-blue-100 text-xs mb-3 uppercase tracking-wide">Latest Readings</p>
          <div className="grid grid-cols-3 gap-4 text-center">
            {[
              { label: "Blood Pressure", value: data.latest_vitals.blood_pressure, unit: "mmHg" },
              { label: "Blood Glucose",  value: data.latest_vitals.glucose ?? "—",  unit: "mg/dL" },
              { label: "Heart Rate",     value: data.latest_vitals.heart_rate ?? "—", unit: "bpm" },
            ].map((v) => (
              <div key={v.label}>
                <p className="text-blue-200 text-xs">{v.label}</p>
                <p className="text-2xl font-bold">{v.value}</p>
                <p className="text-blue-300 text-xs">{v.unit}</p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 text-center">
          <Activity size={32} className="text-blue-400 mx-auto mb-2" />
          <p className="text-sm font-medium text-blue-700">No health records yet</p>
          <p className="text-xs text-blue-500 mt-1">
            <a href="/records" className="underline">Health Records</a> mein jao aur apni vitals add karo
          </p>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Blood Pressure Trend</h2>
          {vitals.length > 1 ? (
            <Line data={{ labels, datasets: [
              { label: "Systolic",  data: vitals.map((v: any) => v.systolic),  borderColor: "#ef4444", backgroundColor: "rgba(239,68,68,0.08)",  tension: 0.4, fill: true, pointRadius: 4 },
              { label: "Diastolic", data: vitals.map((v: any) => v.diastolic), borderColor: "#3b82f6", backgroundColor: "rgba(59,130,246,0.08)", tension: 0.4, fill: true, pointRadius: 4 },
            ]}} options={chartOpts} />
          ) : <div className="flex items-center justify-center h-32 text-gray-400 text-sm">2+ records chahiye</div>}
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Blood Glucose Trend</h2>
          {vitals.length > 1 ? (
            <Line data={{ labels, datasets: [{ label: "Glucose", data: vitals.map((v: any) => v.glucose), borderColor: "#10b981", backgroundColor: "rgba(16,185,129,0.1)", tension: 0.4, fill: true, pointRadius: 4 }]}} options={chartOpts} />
          ) : <div className="flex items-center justify-center h-32 text-gray-400 text-sm">2+ records chahiye</div>}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Heart Rate Trend</h2>
          {vitals.length > 1 ? (
            <Bar data={{ labels, datasets: [{ label: "Heart Rate (bpm)", data: vitals.map((v: any) => v.heart_rate), backgroundColor: "rgba(168,85,247,0.7)", borderRadius: 6, borderWidth: 0 }]}}
              options={{ ...chartOpts, plugins: { ...chartOpts.plugins, legend: { display: false } } }} />
          ) : <div className="flex items-center justify-center h-32 text-gray-400 text-sm">2+ records chahiye</div>}
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Risk Distribution</h2>
          <div className="flex items-center justify-center h-36">
            <Doughnut
              data={{ labels: ["Low","Moderate","High","Critical"], datasets: [{ data: [
                data?.recent_predictions?.filter((p: any) => p.risk_level==="low").length||1,
                data?.recent_predictions?.filter((p: any) => p.risk_level==="moderate").length||0,
                data?.recent_predictions?.filter((p: any) => p.risk_level==="high").length||0,
                data?.recent_predictions?.filter((p: any) => p.risk_level==="critical").length||0,
              ], backgroundColor: ["#10b981","#f59e0b","#f97316","#ef4444"], borderWidth: 0 }]}}
              options={{ plugins: { legend: { position: "right", labels: { boxWidth: 10, font: { size: 10 } } } } }}
            />
          </div>
        </div>
      </div>

      {/* Recent Predictions */}
      {(data?.recent_predictions?.length ?? 0) > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Recent AI Predictions</h2>
          <div className="space-y-3">
            {data.recent_predictions.map((p: any, i: number) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 dark:border-gray-700 last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-50 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                    <Brain size={14} className="text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800 dark:text-white capitalize">{(p.type||p.prediction_type||"").replace(/_/g," ")}</p>
                    <p className="text-xs text-gray-400">Score: {((p.risk_score||0)*100).toFixed(1)}%</p>
                  </div>
                </div>
                <RiskBadge level={p.risk_level||"low"} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Add Vitals",    href: "/records",     icon: "❤️", color: "bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400" },
            { label: "AI Prediction", href: "/predictions", icon: "🧠", color: "bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400" },
            { label: "Medicine",      href: "/medicines",   icon: "💊", color: "bg-purple-50 text-purple-700 hover:bg-purple-100 dark:bg-purple-900/20 dark:text-purple-400" },
            { label: "Diet Plan",     href: "/diet",        icon: "🥗", color: "bg-green-50 text-green-700 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400" },
          ].map((a) => (
            <a key={a.label} href={a.href} className={`flex flex-col items-center gap-2 p-4 rounded-xl text-sm font-medium transition-all ${a.color}`}>
              <span className="text-2xl">{a.icon}</span>{a.label}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

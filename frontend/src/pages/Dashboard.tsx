import React, { useEffect, useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, PointElement,
  LineElement, BarElement, Title, Tooltip, Legend, ArcElement,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { Activity, Heart, Droplets, TrendingUp, Bell, FileText, AlertCircle } from "lucide-react";
import { dashboardAPI } from "../services/api";
import { useAuthStore } from "../store/authStore";

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, Title, Tooltip, Legend, ArcElement
);

const RISK_COLORS: Record<string, string> = {
  low:      "text-green-600 bg-green-50 border-green-200",
  moderate: "text-yellow-600 bg-yellow-50 border-yellow-200",
  high:     "text-orange-600 bg-orange-50 border-orange-200",
  critical: "text-red-600 bg-red-50 border-red-200",
};

const RiskBadge = ({ level }: { level: string }) => (
  <span className={`px-2 py-0.5 rounded-full text-xs font-medium border capitalize ${RISK_COLORS[level] || RISK_COLORS.low}`}>
    {level}
  </span>
);

const StatCard = ({ icon: Icon, label, value, color }: any) => (
  <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm flex items-center gap-4">
    <div className={`p-3 rounded-xl ${color}`}>
      <Icon size={22} className="text-white" />
    </div>
    <div>
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-2xl font-semibold text-gray-900">{value ?? "0"}</p>
    </div>
  </div>
);

export default function Dashboard() {
  const { user } = useAuthStore();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    dashboardAPI.patient()
      .then((res) => {
        setData(res.data);
        setError(null);
      })
      .catch((err) => {
        console.error("Dashboard error:", err);
        setError("Dashboard load nahi hua. Backend se connect ho raha hai...");
        // Set empty data so page doesn't crash
        setData({
          summary: { total_records: 0, total_reports: 0, unread_notifications: 0, active_predictions: 0 },
          vitals_timeline: [],
          recent_predictions: [],
          latest_vitals: {},
        });
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const vitals = data?.vitals_timeline || [];
  const labels = vitals.map((v: any) => v.date?.slice(5) || "");

  const bpChartData = {
    labels,
    datasets: [
      {
        label: "Systolic",
        data: vitals.map((v: any) => v.systolic),
        borderColor: "#ef4444",
        backgroundColor: "rgba(239,68,68,0.1)",
        tension: 0.4,
        fill: true,
      },
      {
        label: "Diastolic",
        data: vitals.map((v: any) => v.diastolic),
        borderColor: "#3b82f6",
        backgroundColor: "rgba(59,130,246,0.1)",
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const glucoseChartData = {
    labels,
    datasets: [{
      label: "Blood Glucose (mg/dL)",
      data: vitals.map((v: any) => v.glucose),
      borderColor: "#10b981",
      backgroundColor: "rgba(16,185,129,0.1)",
      tension: 0.4,
      fill: true,
    }],
  };

  const chartOptions = {
    responsive: true,
    plugins: { legend: { position: "bottom" as const, labels: { boxWidth: 12, font: { size: 11 } } } },
    scales: { x: { grid: { display: false } }, y: { grid: { color: "#f3f4f6" } } },
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">
          Welcome back, {user?.name?.split(" ")[0] || "User"} 👋
        </h1>
        <p className="text-gray-500 text-sm mt-1">Here's your health overview</p>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle size={18} className="text-yellow-600 flex-shrink-0" />
          <p className="text-sm text-yellow-700">{error}</p>
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Activity}  label="Health Records"    value={data?.summary?.total_records}        color="bg-blue-500" />
        <StatCard icon={FileText}  label="Medical Reports"   value={data?.summary?.total_reports}        color="bg-purple-500" />
        <StatCard icon={Bell}      label="Notifications"     value={data?.summary?.unread_notifications} color="bg-amber-500" />
        <StatCard icon={TrendingUp} label="Predictions Run"  value={data?.summary?.active_predictions}   color="bg-green-500" />
      </div>

      {/* Latest Vitals Banner */}
      {data?.latest_vitals?.blood_pressure ? (
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-5 text-white">
          <p className="text-blue-100 text-sm mb-3">Latest Vitals</p>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-blue-200 text-xs">Blood Pressure</p>
              <p className="text-2xl font-bold">{data.latest_vitals.blood_pressure}</p>
              <p className="text-blue-200 text-xs">mmHg</p>
            </div>
            <div>
              <p className="text-blue-200 text-xs">Blood Glucose</p>
              <p className="text-2xl font-bold">{data.latest_vitals.glucose ?? "—"}</p>
              <p className="text-blue-200 text-xs">mg/dL</p>
            </div>
            <div>
              <p className="text-blue-200 text-xs">Heart Rate</p>
              <p className="text-2xl font-bold">{data.latest_vitals.heart_rate ?? "—"}</p>
              <p className="text-blue-200 text-xs">bpm</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 text-center">
          <Activity size={32} className="text-blue-400 mx-auto mb-2" />
          <p className="text-sm font-medium text-blue-700">No health records yet</p>
          <p className="text-xs text-blue-500 mt-1">Go to "Health Records" to add your first vitals</p>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
          <h2 className="text-sm font-medium text-gray-700 mb-4">Blood Pressure Trend</h2>
          {vitals.length > 0
            ? <Line data={bpChartData} options={chartOptions} />
            : <div className="flex items-center justify-center h-32 text-gray-400 text-sm">Add health records to see chart</div>
          }
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
          <h2 className="text-sm font-medium text-gray-700 mb-4">Blood Glucose Trend</h2>
          {vitals.length > 0
            ? <Line data={glucoseChartData} options={chartOptions} />
            : <div className="flex items-center justify-center h-32 text-gray-400 text-sm">Add health records to see chart</div>
          }
        </div>
      </div>

      {/* Recent Predictions */}
      {(data?.recent_predictions?.length ?? 0) > 0 && (
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
          <h2 className="text-sm font-medium text-gray-700 mb-4">Recent AI Predictions</h2>
          <div className="space-y-3">
            {data.recent_predictions.map((p: any, i: number) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div>
                  <p className="text-sm font-medium text-gray-800 capitalize">
                    {(p.type || p.prediction_type || "").replace(/_/g, " ")}
                  </p>
                  <p className="text-xs text-gray-400">
                    Risk score: {((p.risk_score || 0) * 100).toFixed(1)}%
                  </p>
                </div>
                <RiskBadge level={p.risk_level || "low"} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

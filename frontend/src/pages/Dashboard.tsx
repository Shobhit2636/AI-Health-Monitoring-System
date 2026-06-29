import React, { useEffect, useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, PointElement,
  LineElement, BarElement, Title, Tooltip, Legend, ArcElement,
} from "chart.js";
import { Line, Bar, Doughnut } from "react-chartjs-2";
import { Activity, Heart, Droplets, TrendingUp, Bell, FileText, MessageCircle } from "lucide-react";
import { dashboardAPI } from "../services/api";
import { DashboardData, RiskLevel } from "../types";
import { useAuthStore } from "../store/authStore";

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, Title, Tooltip, Legend, ArcElement
);

const RISK_COLORS: Record<RiskLevel, string> = {
  low: "text-green-600 bg-green-50 border-green-200",
  moderate: "text-yellow-600 bg-yellow-50 border-yellow-200",
  high: "text-orange-600 bg-orange-50 border-orange-200",
  critical: "text-red-600 bg-red-50 border-red-200",
};

const RiskBadge = ({ level }: { level: RiskLevel }) => (
  <span className={`px-2 py-0.5 rounded-full text-xs font-medium border capitalize ${RISK_COLORS[level]}`}>
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
      <p className="text-2xl font-semibold text-gray-900">{value ?? "—"}</p>
    </div>
  </div>
);

export default function Dashboard() {
  const { user } = useAuthStore();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardAPI.patient()
      .then((res) => setData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  const vitals = data?.vitals_timeline || [];
  const labels = vitals.map((v) => v.date.slice(5));

  const bpChartData = {
    labels,
    datasets: [
      {
        label: "Systolic",
        data: vitals.map((v) => v.systolic),
        borderColor: "#ef4444",
        backgroundColor: "#fee2e2",
        tension: 0.4,
        fill: true,
      },
      {
        label: "Diastolic",
        data: vitals.map((v) => v.diastolic),
        borderColor: "#3b82f6",
        backgroundColor: "#dbeafe",
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const glucoseChartData = {
    labels,
    datasets: [{
      label: "Blood Glucose (mg/dL)",
      data: vitals.map((v) => v.glucose),
      borderColor: "#10b981",
      backgroundColor: "#d1fae5",
      tension: 0.4,
      fill: true,
    }],
  };

  const riskDoughnutData = {
    labels: ["Low", "Moderate", "High", "Critical"],
    datasets: [{
      data: [40, 30, 20, 10],
      backgroundColor: ["#10b981", "#f59e0b", "#f97316", "#ef4444"],
      borderWidth: 0,
    }],
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">
          Welcome back, {user?.name?.split(" ")[0]} 👋
        </h1>
        <p className="text-gray-500 text-sm mt-1">Here's your health overview</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Activity} label="Health Records" value={data?.summary.total_records} color="bg-blue-500" />
        <StatCard icon={FileText} label="Medical Reports" value={data?.summary.total_reports} color="bg-purple-500" />
        <StatCard icon={Bell} label="Notifications" value={data?.summary.unread_notifications} color="bg-amber-500" />
        <StatCard icon={TrendingUp} label="Predictions Run" value={data?.summary.active_predictions} color="bg-green-500" />
      </div>

      {/* Latest Vitals */}
      {data?.latest_vitals?.blood_pressure && (
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
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
          <h2 className="text-sm font-medium text-gray-700 mb-4">Blood Pressure Trend</h2>
          {vitals.length > 0
            ? <Line data={bpChartData} options={{ responsive: true, plugins: { legend: { position: "bottom" } } }} />
            : <p className="text-center text-gray-400 py-8 text-sm">No records yet. Add your first health record.</p>
          }
        </div>

        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
          <h2 className="text-sm font-medium text-gray-700 mb-4">Blood Glucose Trend</h2>
          {vitals.length > 0
            ? <Line data={glucoseChartData} options={{ responsive: true, plugins: { legend: { position: "bottom" } } }} />
            : <p className="text-center text-gray-400 py-8 text-sm">No records yet.</p>
          }
        </div>
      </div>

      {/* Recent Predictions */}
      {(data?.recent_predictions?.length ?? 0) > 0 && (
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
          <h2 className="text-sm font-medium text-gray-700 mb-4">Recent AI Predictions</h2>
          <div className="space-y-3">
            {data!.recent_predictions.map((p, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div>
                  <p className="text-sm font-medium text-gray-800 capitalize">
                    {p.prediction_type.replace("_", " ")}
                  </p>
                  <p className="text-xs text-gray-400">
                    Risk score: {(p.risk_score * 100).toFixed(1)}%
                  </p>
                </div>
                <RiskBadge level={p.risk_level} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

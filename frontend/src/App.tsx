import React, { Component, ReactNode } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { ThemeProvider } from "./contexts/ThemeContext";
import { useAuthStore } from "./store/authStore";
import Layout from "./components/common/Layout";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import HealthRecords from "./pages/HealthRecords";
import Predictions from "./pages/Predictions";
import Reports from "./pages/Reports";
import Chatbot from "./pages/Chatbot";
import Profile from "./pages/Profile";
import Notifications from "./pages/Notifications";
import DoctorPortal from "./pages/DoctorPortal";
import AdminPortal from "./pages/AdminPortal";
import MedicineReminder from "./pages/MedicineReminder";
import HealthGoals from "./pages/HealthGoals";
import DietPlanner from "./pages/DietPlanner";

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; error: string }> {
  state = { hasError: false, error: "" };
  static getDerivedStateFromError(error: Error) { return { hasError: true, error: error.message }; }
  componentDidCatch(error: Error) { console.error("App Error:", error); }
  render() {
    if (this.state.hasError) return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">⚠️</span>
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Kuch problem aayi</h2>
          <p className="text-sm text-gray-500 mb-4">{this.state.error}</p>
          <button onClick={() => { this.setState({ hasError: false }); window.location.href = "/dashboard"; }}
            className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700">
            Dashboard pe wapas jao
          </button>
        </div>
      </div>
    );
    return this.props.children;
  }
}

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

function PublicRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  return !isAuthenticated ? <>{children}</> : <Navigate to="/dashboard" replace />;
}

export default function App() {
  return (
    <ThemeProvider>
      <ErrorBoundary>
        <BrowserRouter>
          <Toaster position="top-right" toastOptions={{ duration: 3000, style: { fontSize: "13px", borderRadius: "10px" } }} />
          <Routes>
            <Route path="/login"    element={<PublicRoute><Auth mode="login" /></PublicRoute>} />
            <Route path="/register" element={<PublicRoute><Auth mode="register" /></PublicRoute>} />
            <Route path="/"         element={<Navigate to="/dashboard" replace />} />
            <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
              <Route path="/dashboard"     element={<ErrorBoundary><Dashboard /></ErrorBoundary>} />
              <Route path="/records"       element={<ErrorBoundary><HealthRecords /></ErrorBoundary>} />
              <Route path="/predictions"   element={<ErrorBoundary><Predictions /></ErrorBoundary>} />
              <Route path="/reports"       element={<ErrorBoundary><Reports /></ErrorBoundary>} />
              <Route path="/chatbot"       element={<ErrorBoundary><Chatbot /></ErrorBoundary>} />
              <Route path="/medicines"     element={<ErrorBoundary><MedicineReminder /></ErrorBoundary>} />
              <Route path="/goals"         element={<ErrorBoundary><HealthGoals /></ErrorBoundary>} />
              <Route path="/diet"          element={<ErrorBoundary><DietPlanner /></ErrorBoundary>} />
              <Route path="/profile"       element={<ErrorBoundary><Profile /></ErrorBoundary>} />
              <Route path="/notifications" element={<ErrorBoundary><Notifications /></ErrorBoundary>} />
              <Route path="/doctor"        element={<ErrorBoundary><DoctorPortal /></ErrorBoundary>} />
              <Route path="/admin"         element={<ErrorBoundary><AdminPortal /></ErrorBoundary>} />
            </Route>
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </ErrorBoundary>
    </ThemeProvider>
  );
}

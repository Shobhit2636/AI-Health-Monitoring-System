import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
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

// Lazy pages (lower priority)
const DoctorPortal = React.lazy(() => import("./pages/DoctorPortal"));
const AdminPortal = React.lazy(() => import("./pages/AdminPortal"));

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  return !isAuthenticated ? <>{children}</> : <Navigate to="/dashboard" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: { fontSize: "13px", borderRadius: "10px" },
        }}
      />
      <Routes>
        {/* Public */}
        <Route path="/login"    element={<PublicRoute><Auth mode="login" /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><Auth mode="register" /></PublicRoute>} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        {/* Protected */}
        <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route path="/dashboard"     element={<Dashboard />} />
          <Route path="/records"       element={<HealthRecords />} />
          <Route path="/predictions"   element={<Predictions />} />
          <Route path="/reports"       element={<Reports />} />
          <Route path="/chatbot"       element={<Chatbot />} />
          <Route path="/profile"       element={<Profile />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/doctor"        element={
            <React.Suspense fallback={<div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"/></div>}>
              <DoctorPortal />
            </React.Suspense>
          }/>
          <Route path="/admin" element={
            <React.Suspense fallback={<div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"/></div>}>
              <AdminPortal />
            </React.Suspense>
          }/>
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

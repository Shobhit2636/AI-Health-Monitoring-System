import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Heart, Mail, Lock, User, Phone, Eye, EyeOff } from "lucide-react";
import toast from "react-hot-toast";
import { authAPI } from "../services/api";
import { useAuthStore } from "../store/authStore";

interface LoginPageProps { mode?: "login" | "register"; }

export default function AuthPage({ mode = "login" }: LoginPageProps) {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [isLogin, setIsLogin] = useState(mode === "login");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [form, setForm] = useState({
    email: "", password: "", full_name: "", phone: "", role: "patient",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      let res;
      if (isLogin) {
        res = await authAPI.login(form.email, form.password);
      } else {
        res = await authAPI.register(form);
      }
      const { access_token, refresh_token, user } = res.data;
      login(user, access_token, refresh_token);
      toast.success(`Welcome${user.name ? ", " + user.name.split(" ")[0] : ""}!`);
      navigate("/dashboard");
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-600 rounded-2xl mb-3">
            <Heart className="text-white" size={28} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">AI Health Monitor</h1>
          <p className="text-gray-500 text-sm">Your intelligent health companion</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Toggle */}
          <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
            {["Login", "Register"].map((tab) => (
              <button
                key={tab}
                onClick={() => setIsLogin(tab === "Login")}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                  (isLogin && tab === "Login") || (!isLogin && tab === "Register")
                    ? "bg-white shadow text-blue-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="relative">
                <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  name="full_name" type="text" required placeholder="Full name"
                  value={form.full_name} onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}

            <div className="relative">
              <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                name="email" type="email" required placeholder="Email address"
                value={form.email} onChange={handleChange}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                name="password" type={showPass ? "text" : "password"} required placeholder="Password"
                value={form.password} onChange={handleChange}
                className="w-full pl-10 pr-10 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button type="button" onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {!isLogin && (
              <>
                <div className="relative">
                  <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    name="phone" type="tel" placeholder="Phone number"
                    value={form.phone} onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <select
                  name="role" value={form.role} onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
                >
                  <option value="patient">Patient</option>
                  <option value="doctor">Doctor</option>
                </select>
              </>
            )}

            <button
              type="submit" disabled={loading}
              className="w-full py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  {isLogin ? "Signing in..." : "Creating account..."}
                </span>
              ) : isLogin ? "Sign In" : "Create Account"}
            </button>
          </form>

          <p className="text-center text-xs text-gray-400 mt-4">
            By continuing, you agree to our{" "}
            <a href="#" className="text-blue-600 hover:underline">Terms</a> and{" "}
            <a href="#" className="text-blue-600 hover:underline">Privacy Policy</a>
          </p>
        </div>
      </div>
    </div>
  );
}

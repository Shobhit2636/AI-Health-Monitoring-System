import React, { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Activity, Brain, FileText, MessageCircle,
  Bell, UserCircle, Stethoscope, Shield, LogOut, Heart,
  Menu, X, Pill, Target, Utensils, Sun, Moon,
} from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import { useTheme } from "../../contexts/ThemeContext";

const NAV_ITEMS = [
  { to: "/dashboard",     icon: LayoutDashboard, label: "Dashboard",       roles: ["patient","doctor","admin"] },
  { to: "/records",       icon: Activity,        label: "Health Records",  roles: ["patient"] },
  { to: "/predictions",   icon: Brain,           label: "AI Predictions",  roles: ["patient"] },
  { to: "/medicines",     icon: Pill,            label: "Medicine",        roles: ["patient"] },
  { to: "/goals",         icon: Target,          label: "Health Goals",    roles: ["patient"] },
  { to: "/diet",          icon: Utensils,        label: "Diet Planner",    roles: ["patient"] },
  { to: "/reports",       icon: FileText,        label: "Medical Reports", roles: ["patient"] },
  { to: "/chatbot",       icon: MessageCircle,   label: "Health Chat",     roles: ["patient","doctor","admin"] },
  { to: "/doctor",        icon: Stethoscope,     label: "Doctor Portal",   roles: ["doctor"] },
  { to: "/admin",         icon: Shield,          label: "Admin Portal",    roles: ["admin"] },
  { to: "/notifications", icon: Bell,            label: "Notifications",   roles: ["patient","doctor","admin"] },
  { to: "/profile",       icon: UserCircle,      label: "Profile",         roles: ["patient","doctor","admin"] },
];

export default function Layout() {
  const { user, logout } = useAuthStore();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => { logout(); navigate("/login"); };
  const userRole = user?.role || "patient";
  const visibleNav = NAV_ITEMS.filter((item) => item.roles.includes(userRole));

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-gray-100 dark:border-gray-700">
        <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
          <Heart size={18} className="text-white" />
        </div>
        <div>
          <p className="text-sm font-bold text-gray-900 dark:text-white">HealthAI</p>
          <p className="text-xs text-gray-400 capitalize">{userRole} Portal</p>
        </div>
        {/* Dark Mode Toggle */}
        <button onClick={toggleTheme}
          className="ml-auto p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400">
          {isDark ? <Sun size={16} /> : <Moon size={16} />}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {visibleNav.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                isActive
                  ? "bg-blue-600 text-white font-medium shadow-sm"
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white"
              }`
            }
          >
            <Icon size={17} />{label}
          </NavLink>
        ))}
      </nav>

      {/* User + Logout */}
      <div className="p-3 border-t border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-3 px-3 py-2 mb-1">
          <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 font-semibold text-sm flex-shrink-0">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-gray-900 dark:text-white truncate">{user?.name}</p>
            <p className="text-xs text-gray-400 truncate">{user?.email}</p>
          </div>
        </div>
        <button onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all">
          <LogOut size={16} /> Logout
        </button>
      </div>
    </>
  );

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-56 flex-shrink-0 bg-white dark:bg-gray-800 border-r border-gray-100 dark:border-gray-700 flex-col shadow-sm">
        <SidebarContent />
      </aside>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/40" onClick={() => setSidebarOpen(false)} />
          <aside className="relative z-50 w-56 bg-white dark:bg-gray-800 flex flex-col shadow-xl">
            <button onClick={() => setSidebarOpen(false)} className="absolute top-3 right-3 p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-500">
              <X size={18} />
            </button>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile Header */}
        <header className="lg:hidden bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 px-4 py-3 flex items-center gap-3">
          <button onClick={() => setSidebarOpen(true)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-600 dark:text-gray-400">
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
              <Heart size={14} className="text-white" />
            </div>
            <p className="text-sm font-bold text-gray-900 dark:text-white">HealthAI</p>
          </div>
          <button onClick={toggleTheme} className="ml-auto p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-500 dark:text-gray-400">
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </header>

        <main className="flex-1 overflow-y-auto p-5 lg:p-7">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

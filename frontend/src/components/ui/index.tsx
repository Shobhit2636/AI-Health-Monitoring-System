import React from "react";
import { Loader2, X } from "lucide-react";

// ─── Button ──────────────────────────────────────────────────
type ButtonVariant = "primary" | "secondary" | "danger" | "ghost" | "success";
type ButtonSize    = "sm" | "md" | "lg";

const BTN_VARIANTS: Record<ButtonVariant, string> = {
  primary:   "bg-blue-600 text-white hover:bg-blue-700 shadow-sm",
  secondary: "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50",
  danger:    "bg-red-600 text-white hover:bg-red-700",
  ghost:     "text-gray-600 hover:bg-gray-100",
  success:   "bg-green-600 text-white hover:bg-green-700",
};
const BTN_SIZES: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2.5 text-sm",
  lg: "px-6 py-3 text-base",
};

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?:    ButtonSize;
  loading?: boolean;
  icon?:    React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = "primary", size = "md", loading = false,
  icon, children, className = "", disabled, ...rest
}) => (
  <button
    {...rest}
    disabled={disabled || loading}
    className={`inline-flex items-center justify-center gap-2 font-medium rounded-xl transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed ${BTN_VARIANTS[variant]} ${BTN_SIZES[size]} ${className}`}
  >
    {loading ? <Loader2 size={15} className="animate-spin" /> : icon}
    {children}
  </button>
);


// ─── Card ────────────────────────────────────────────────────
interface CardProps {
  title?:     string;
  subtitle?:  string;
  action?:    React.ReactNode;
  children:   React.ReactNode;
  className?: string;
  padding?:   boolean;
}

export const Card: React.FC<CardProps> = ({
  title, subtitle, action, children, className = "", padding = true,
}) => (
  <div className={`bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden ${className}`}>
    {(title || action) && (
      <div className="flex items-start justify-between px-5 py-4 border-b border-gray-100">
        <div>
          {title    && <h3 className="text-sm font-semibold text-gray-900">{title}</h3>}
          {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
        </div>
        {action && <div>{action}</div>}
      </div>
    )}
    <div className={padding ? "p-5" : ""}>{children}</div>
  </div>
);


// ─── Badge ───────────────────────────────────────────────────
type BadgeVariant = "blue" | "green" | "yellow" | "red" | "gray" | "purple";

const BADGE_STYLES: Record<BadgeVariant, string> = {
  blue:   "bg-blue-50   text-blue-700   border-blue-200",
  green:  "bg-green-50  text-green-700  border-green-200",
  yellow: "bg-yellow-50 text-yellow-700 border-yellow-200",
  red:    "bg-red-50    text-red-700    border-red-200",
  gray:   "bg-gray-50   text-gray-600   border-gray-200",
  purple: "bg-purple-50 text-purple-700 border-purple-200",
};

interface BadgeProps {
  variant?:   BadgeVariant;
  children:   React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ variant = "gray", children, className = "" }) => (
  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${BADGE_STYLES[variant]} ${className}`}>
    {children}
  </span>
);


// ─── Spinner ─────────────────────────────────────────────────
export const Spinner: React.FC<{ size?: number; className?: string }> = ({ size = 6, className = "" }) => (
  <div className={`flex items-center justify-center ${className}`}>
    <div className={`w-${size} h-${size} border-4 border-blue-500 border-t-transparent rounded-full animate-spin`} />
  </div>
);


// ─── Empty State ─────────────────────────────────────────────
interface EmptyStateProps {
  icon:        React.ReactNode;
  title:       string;
  description?: string;
  action?:     React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, description, action }) => (
  <div className="flex flex-col items-center justify-center py-12 text-center">
    <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center text-gray-400 mb-4">
      {icon}
    </div>
    <h3 className="text-sm font-semibold text-gray-800 mb-1">{title}</h3>
    {description && <p className="text-xs text-gray-400 max-w-xs mb-4">{description}</p>}
    {action}
  </div>
);


// ─── Modal ───────────────────────────────────────────────────
interface ModalProps {
  isOpen:     boolean;
  onClose:    () => void;
  title:      string;
  children:   React.ReactNode;
  maxWidth?:  string;
  footer?:    React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen, onClose, title, children, maxWidth = "max-w-lg", footer,
}) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative z-50 w-full ${maxWidth} bg-white rounded-2xl shadow-2xl flex flex-col max-h-[90vh]`}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-all">
            <X size={16} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5">{children}</div>
        {footer && <div className="px-5 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl">{footer}</div>}
      </div>
    </div>
  );
};


// ─── Input ───────────────────────────────────────────────────
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?:   string;
  error?:   string;
  hint?:    string;
  prefix?:  React.ReactNode;
  suffix?:  React.ReactNode;
}

export const Input: React.FC<InputProps> = ({
  label, error, hint, prefix, suffix, className = "", ...rest
}) => (
  <div className="space-y-1">
    {label && <label className="block text-xs font-medium text-gray-600">{label}</label>}
    <div className="relative">
      {prefix && (
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">{prefix}</div>
      )}
      <input
        {...rest}
        className={`w-full ${prefix ? "pl-9" : "pl-3"} ${suffix ? "pr-9" : "pr-3"} py-2.5 border rounded-xl text-sm
          focus:outline-none focus:ring-2 transition-all
          ${error ? "border-red-300 focus:ring-red-200" : "border-gray-200 focus:ring-blue-200 focus:border-blue-400"}
          ${className}`}
      />
      {suffix && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">{suffix}</div>
      )}
    </div>
    {error && <p className="text-xs text-red-500">{error}</p>}
    {hint  && !error && <p className="text-xs text-gray-400">{hint}</p>}
  </div>
);


// ─── Alert ───────────────────────────────────────────────────
type AlertType = "info" | "success" | "warning" | "error";

const ALERT_STYLES: Record<AlertType, string> = {
  info:    "bg-blue-50   border-blue-200   text-blue-800",
  success: "bg-green-50  border-green-200  text-green-800",
  warning: "bg-yellow-50 border-yellow-200 text-yellow-800",
  error:   "bg-red-50    border-red-200    text-red-800",
};

export const Alert: React.FC<{ type?: AlertType; children: React.ReactNode; className?: string }> = ({
  type = "info", children, className = "",
}) => (
  <div className={`px-4 py-3 rounded-xl border text-sm ${ALERT_STYLES[type]} ${className}`}>
    {children}
  </div>
);

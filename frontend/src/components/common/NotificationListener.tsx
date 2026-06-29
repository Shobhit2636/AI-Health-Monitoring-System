import React, { useEffect } from "react";
import toast from "react-hot-toast";
import { Bell, CheckCircle, AlertCircle, AlertTriangle, Info } from "lucide-react";
import { useWebSocket } from "../../hooks";
import { useAuthStore } from "../../store/authStore";

const ICONS = {
  success: <CheckCircle  size={16} className="text-green-500" />,
  alert:   <AlertCircle  size={16} className="text-red-500"   />,
  warning: <AlertTriangle size={16} className="text-yellow-500" />,
  info:    <Info         size={16} className="text-blue-500"  />,
};

export const NotificationListener: React.FC = () => {
  const { user } = useAuthStore();
  const { lastMessage, connected } = useWebSocket(user?.id);

  useEffect(() => {
    if (!lastMessage || lastMessage.type !== "notification") return;

    const { title = "Notification", message = "", notif_type = "info" } = lastMessage;
    const icon = ICONS[notif_type as keyof typeof ICONS] || ICONS.info;

    toast.custom(
      (t) => (
        <div
          onClick={() => toast.dismiss(t.id)}
          className={`flex items-start gap-3 bg-white border border-gray-100 shadow-lg rounded-xl px-4 py-3 max-w-sm cursor-pointer transition-all ${t.visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"}`}
        >
          <div className="mt-0.5">{icon}</div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900">{title}</p>
            {message && <p className="text-xs text-gray-500 mt-0.5">{message}</p>}
          </div>
        </div>
      ),
      { duration: 4000 }
    );
  }, [lastMessage]);

  return null;
};

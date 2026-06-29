import React, { useState, useEffect } from "react";
import { Bell, CheckCheck } from "lucide-react";
import { notificationsAPI } from "../services/api";
import { Notification } from "../types";
import toast from "react-hot-toast";

const TYPE_COLORS: Record<string, string> = { info:"bg-blue-50 border-blue-200", success:"bg-green-50 border-green-200", warning:"bg-yellow-50 border-yellow-200", alert:"bg-red-50 border-red-200" };

export default function Notifications() {
  const [notifs, setNotifs] = useState<Notification[]>([]);
  useEffect(() => { notificationsAPI.list().then(r=>setNotifs(r.data)).catch(()=>{}); }, []);
  const markAllRead = async () => { await notificationsAPI.markAllRead(); setNotifs(n=>n.map(x=>({...x,is_read:true}))); toast.success("All marked as read."); };
  return (
    <div className="max-w-xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900 flex items-center gap-2"><Bell size={24} className="text-blue-600"/>Notifications</h1>
        <button onClick={markAllRead} className="text-sm text-blue-600 flex items-center gap-1 hover:underline"><CheckCheck size={15}/>Mark all read</button>
      </div>
      {notifs.length===0?<p className="text-center py-12 text-gray-400 text-sm">No notifications yet.</p>:notifs.map(n=>(
        <div key={n.id} className={`rounded-xl border p-4 ${TYPE_COLORS[n.type]||"bg-gray-50 border-gray-200"} ${!n.is_read?"ring-1 ring-blue-300":""}`}>
          <div className="flex items-start justify-between gap-3">
            <div><p className="text-sm font-medium text-gray-900">{n.title}</p><p className="text-xs text-gray-600 mt-0.5">{n.message}</p></div>
            {!n.is_read&&<span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1"/>}
          </div>
          <p className="text-xs text-gray-400 mt-2">{new Date(n.created_at).toLocaleString()}</p>
        </div>
      ))}
    </div>
  );
}

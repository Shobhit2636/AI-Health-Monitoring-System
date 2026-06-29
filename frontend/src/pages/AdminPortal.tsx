import React, { useState, useEffect } from "react";
import { Shield, Users, ToggleLeft, ToggleRight } from "lucide-react";
import { adminAPI } from "../services/api";
import toast from "react-hot-toast";

export default function AdminPortal() {
  const [users, setUsers] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    adminAPI.listUsers().then(r=>setUsers(r.data)).catch(()=>{});
    adminAPI.stats().then(r=>setStats(r.data)).catch(()=>{});
  }, []);

  const toggleUser = async (id: string) => {
    try {
      const r = await adminAPI.toggleUser(id);
      setUsers(u=>u.map(x=>x.id===id?{...x,is_active:r.data.is_active}:x));
      toast.success(r.data.message);
    } catch { toast.error("Failed."); }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-900 flex items-center gap-2"><Shield size={24} className="text-blue-600"/>Admin Portal</h1>
      {stats && (
        <div className="grid grid-cols-3 gap-4">
          {[["Total Users",stats.total_users,"bg-blue-500"],["Predictions",stats.total_predictions,"bg-purple-500"],["Reports",stats.total_reports,"bg-green-500"]].map(([label,val,color])=>(
            <div key={String(label)} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-center">
              <p className="text-2xl font-bold text-gray-900">{val}</p><p className="text-xs text-gray-500">{label}</p>
            </div>
          ))}
        </div>
      )}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100"><h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2"><Users size={15}/>All Users</h2></div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50"><tr>{["Name","Email","Role","Status","Action"].map(h=><th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500">{h}</th>)}</tr></thead>
          <tbody className="divide-y divide-gray-50">
            {users.map(u=>(
              <tr key={u.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{u.name}</td>
                <td className="px-4 py-3 text-gray-500">{u.email}</td>
                <td className="px-4 py-3"><span className="capitalize px-2 py-0.5 rounded-full text-xs bg-blue-50 text-blue-600">{u.role}</span></td>
                <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs ${u.is_active?"bg-green-50 text-green-600":"bg-red-50 text-red-600"}`}>{u.is_active?"Active":"Inactive"}</span></td>
                <td className="px-4 py-3"><button onClick={()=>toggleUser(u.id)} className="text-gray-400 hover:text-blue-600 transition-colors">{u.is_active?<ToggleRight size={20}/>:<ToggleLeft size={20}/>}</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from "react";
import { UserCircle, Save } from "lucide-react";
import toast from "react-hot-toast";
import { usersAPI } from "../services/api";
import { useAuthStore } from "../store/authStore";

export default function Profile() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [form, setForm] = useState({ full_name: "", phone: "", age: "", gender: "", height_cm: "", weight_kg: "", blood_type: "" });

  useEffect(() => {
    usersAPI.getProfile().then((r) => {
      setProfile(r.data);
      setForm({ full_name: r.data.full_name || "", phone: r.data.phone || "", age: r.data.health_profile?.age || "", gender: r.data.health_profile?.gender || "", height_cm: r.data.health_profile?.height_cm || "", weight_kg: r.data.health_profile?.weight_kg || "", blood_type: r.data.health_profile?.blood_type || "" });
    }).catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    try {
      const payload: any = { ...form };
      if (form.age) payload.age = parseInt(form.age);
      if (form.height_cm) payload.height_cm = parseFloat(form.height_cm);
      if (form.weight_kg) payload.weight_kg = parseFloat(form.weight_kg);
      await usersAPI.updateProfile(payload);
      toast.success("Profile updated!");
    } catch { toast.error("Update failed."); }
    finally { setLoading(false); }
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <h1 className="text-2xl font-semibold text-gray-900 flex items-center gap-2"><UserCircle size={24} className="text-blue-600" /> My Profile</h1>
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-100">
          <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600 text-2xl font-bold">{user?.name?.charAt(0)}</div>
          <div><p className="font-semibold text-gray-900">{user?.name}</p><p className="text-sm text-gray-400">{user?.email}</p><span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full capitalize">{user?.role}</span></div>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {[{name:"full_name",label:"Full Name"},{name:"phone",label:"Phone"},{name:"age",label:"Age"},{name:"gender",label:"Gender"},{name:"height_cm",label:"Height (cm)"},{name:"weight_kg",label:"Weight (kg)"},{name:"blood_type",label:"Blood Type"}].map(({name,label})=>(
              <div key={name}>
                <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
                <input type="text" name={name} value={(form as any)[name]} onChange={e=>setForm(f=>({...f,[e.target.name]:e.target.value}))} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            ))}
          </div>
          {profile?.health_profile?.bmi && <div className="bg-blue-50 rounded-lg p-3 text-sm text-blue-700">BMI: <strong>{profile.health_profile.bmi}</strong></div>}
          <button type="submit" disabled={loading} className="w-full py-2.5 bg-blue-600 text-white rounded-xl font-medium text-sm hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2">
            <Save size={15} />{loading?"Saving...":"Save Profile"}
          </button>
        </form>
      </div>
    </div>
  );
}

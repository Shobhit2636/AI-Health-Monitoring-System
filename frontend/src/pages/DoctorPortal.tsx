import React, { useState, useEffect } from "react";
import { Stethoscope, Users, Activity } from "lucide-react";
import { doctorAPI } from "../services/api";
import toast from "react-hot-toast";

export default function DoctorPortal() {
  const [patients, setPatients] = useState<any[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [records, setRecords] = useState<any[]>([]);

  useEffect(() => { doctorAPI.listPatients().then(r=>setPatients(r.data)).catch(()=>{}); }, []);

  const loadRecords = async (patient: any) => {
    setSelectedPatient(patient);
    try { const r = await doctorAPI.getPatientRecords(patient.id); setRecords(r.data); }
    catch { toast.error("Failed to load records."); }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-900 flex items-center gap-2"><Stethoscope size={24} className="text-blue-600"/>Doctor Portal</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2"><Users size={15}/>Patients ({patients.length})</h2>
          <div className="space-y-2">
            {patients.map(p=>(
              <button key={p.id} onClick={()=>loadRecords(p)} className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-all ${selectedPatient?.id===p.id?"bg-blue-50 text-blue-700 font-medium":"hover:bg-gray-50 text-gray-700"}`}>
                <p className="font-medium">{p.name}</p><p className="text-xs text-gray-400">{p.email}</p>
              </button>
            ))}
          </div>
        </div>
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          {selectedPatient ? (
            <>
              <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2"><Activity size={15}/>Records — {selectedPatient.name}</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50"><tr>{["Date","BP","Glucose","Heart Rate"].map(h=><th key={h} className="px-3 py-2 text-left text-gray-500 font-medium">{h}</th>)}</tr></thead>
                  <tbody className="divide-y divide-gray-50">
                    {records.map(r=><tr key={r.id} className="hover:bg-gray-50"><td className="px-3 py-2 text-gray-600">{new Date(r.recorded_at).toLocaleDateString()}</td><td className="px-3 py-2">{r.blood_pressure_systolic??"-"}</td><td className="px-3 py-2">{r.blood_glucose??"-"}</td><td className="px-3 py-2">{r.heart_rate??"-"}</td></tr>)}
                  </tbody>
                </table>
                {records.length===0&&<p className="text-center py-6 text-gray-400 text-sm">No records found.</p>}
              </div>
            </>
          ) : <div className="flex items-center justify-center h-48 text-gray-400 text-sm">Select a patient to view records</div>}
        </div>
      </div>
    </div>
  );
}

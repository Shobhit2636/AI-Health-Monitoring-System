import React, { useState, useEffect, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, FileText, CheckCircle, Clock, XCircle, Eye, Download, Loader } from "lucide-react";
import toast from "react-hot-toast";
import { reportsAPI } from "../services/api";
import { MedicalReport, ReportStatus } from "../types";

const STATUS_CONFIG: Record<ReportStatus, { icon: typeof Clock; color: string; label: string }> = {
  pending:    { icon: Clock,        color: "text-gray-500",   label: "Pending" },
  processing: { icon: Loader,       color: "text-blue-500",   label: "Analyzing..." },
  completed:  { icon: CheckCircle,  color: "text-green-500",  label: "Complete" },
  failed:     { icon: XCircle,      color: "text-red-500",    label: "Failed" },
};

function ReportCard({ report, onView }: { report: MedicalReport; onView: (r: MedicalReport) => void }) {
  const { icon: Icon, color, label } = STATUS_CONFIG[report.status];
  const sizeKB = report.file_size ? (report.file_size / 1024).toFixed(1) : "?";

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-4">
      <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center flex-shrink-0">
        <FileText size={20} className="text-red-500" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{report.file_name}</p>
        <div className="flex items-center gap-3 mt-0.5">
          <span className="text-xs text-gray-400">{sizeKB} KB</span>
          <span className="text-xs text-gray-300">•</span>
          <span className="text-xs text-gray-400">
            {new Date(report.uploaded_at).toLocaleDateString()}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <div className={`flex items-center gap-1 ${color}`}>
          <Icon size={14} className={report.status === "processing" ? "animate-spin" : ""} />
          <span className="text-xs font-medium">{label}</span>
        </div>
        {report.status === "completed" && (
          <button
            onClick={() => onView(report)}
            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
            title="View Analysis"
          >
            <Eye size={15} />
          </button>
        )}
      </div>
    </div>
  );
}

function AnalysisModal({ report, onClose }: { report: MedicalReport; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-green-50 rounded-xl flex items-center justify-center">
              <CheckCircle size={18} className="text-green-500" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">{report.file_name}</p>
              <p className="text-xs text-gray-400">AI Analysis Complete</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-all">✕</button>
        </div>
        <div className="flex-1 overflow-y-auto p-5">
          <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed whitespace-pre-wrap">
            {report.ai_analysis || "Analysis not available."}
          </div>
        </div>
        {report.download_url && (
          <div className="p-4 border-t border-gray-100">
            <a
              href={report.download_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-all"
            >
              <Download size={15} /> Download Original PDF
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Reports() {
  const [reports, setReports] = useState<MedicalReport[]>([]);
  const [uploading, setUploading] = useState(false);
  const [selectedReport, setSelectedReport] = useState<MedicalReport | null>(null);

  const fetchReports = async () => {
    try {
      const r = await reportsAPI.list();
      setReports(r.data);
    } catch {}
  };

  useEffect(() => {
    fetchReports();
    const interval = setInterval(fetchReports, 10000); // Poll every 10s
    return () => clearInterval(interval);
  }, []);

  const onDrop = useCallback(async (files: File[]) => {
    if (!files[0]) return;
    const file = files[0];
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File must be under 10MB.");
      return;
    }
    setUploading(true);
    try {
      await reportsAPI.upload(file);
      toast.success("Report uploaded! AI analysis starting...");
      await fetchReports();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Upload failed.");
    } finally {
      setUploading(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"], "image/jpeg": [".jpg", ".jpeg"], "image/png": [".png"] },
    maxFiles: 1,
    disabled: uploading,
  });

  const handleViewFull = async (report: MedicalReport) => {
    try {
      const r = await reportsAPI.get(report.id);
      setSelectedReport(r.data);
    } catch {
      toast.error("Failed to load report.");
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
          <FileText size={24} className="text-blue-600" /> Medical Reports
        </h1>
        <p className="text-gray-500 text-sm mt-1">Upload PDF reports for AI-powered analysis</p>
      </div>

      {/* Upload Zone */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all ${
          isDragActive ? "border-blue-400 bg-blue-50" : "border-gray-200 hover:border-blue-300 hover:bg-gray-50"
        } ${uploading ? "opacity-60 cursor-not-allowed" : ""}`}
      >
        <input {...getInputProps()} />
        {uploading ? (
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-medium text-blue-600">Uploading and starting AI analysis...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${isDragActive ? "bg-blue-100" : "bg-gray-100"}`}>
              <Upload size={26} className={isDragActive ? "text-blue-600" : "text-gray-400"} />
            </div>
            <div>
              <p className="font-medium text-gray-800">
                {isDragActive ? "Drop to upload" : "Drag & drop your medical report"}
              </p>
              <p className="text-sm text-gray-400 mt-1">PDF, JPG, PNG up to 10MB</p>
            </div>
            <span className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700">
              Browse Files
            </span>
          </div>
        )}
      </div>

      {/* Reports List */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-700">Your Reports ({reports.length})</h2>
          <button onClick={fetchReports} className="text-xs text-blue-600 hover:underline">Refresh</button>
        </div>
        {reports.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <FileText size={36} className="mx-auto mb-3 opacity-40" />
            <p className="text-sm">No reports uploaded yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {reports.map((r) => (
              <ReportCard key={r.id} report={r} onView={handleViewFull} />
            ))}
          </div>
        )}
      </div>

      {/* Info box */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-xs text-blue-700">
        <strong>How it works:</strong> Upload your lab report, blood test, or medical scan PDF. Our AI (powered by Google Gemini) will analyze it and provide a plain-language summary with key findings and recommendations — usually within 30 seconds.
      </div>

      {selectedReport && (
        <AnalysisModal report={selectedReport} onClose={() => setSelectedReport(null)} />
      )}
    </div>
  );
}

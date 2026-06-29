// ─── Auth ────────────────────────────────────────────────────
export type UserRole = "patient" | "doctor" | "admin";

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  is_active: boolean;
  is_verified: boolean;
  avatar_url?: string;
  created_at: string;
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
}

// ─── Health ──────────────────────────────────────────────────
export interface HealthRecord {
  id: string;
  recorded_at: string;
  blood_pressure?: string;
  heart_rate?: number;
  blood_glucose?: number;
  cholesterol_total?: number;
  oxygen_saturation?: number;
  temperature?: number;
  hba1c?: number;
  notes?: string;
}

export interface HealthProfile {
  age?: number;
  gender?: string;
  height_cm?: number;
  weight_kg?: number;
  bmi?: number;
  blood_type?: string;
  allergies: string[];
  chronic_conditions: string[];
  medications: string[];
}

// ─── Predictions ─────────────────────────────────────────────
export type RiskLevel = "low" | "moderate" | "high" | "critical";

export interface Prediction {
  id?: string;
  prediction_type: string;
  risk_level: RiskLevel;
  risk_score: number;
  confidence: number;
  recommendations: string[];
  created_at?: string;
}

export interface DiabetesPredictionInput {
  glucose: number;
  bmi: number;
  age: number;
  blood_pressure: number;
  pregnancies?: number;
  insulin?: number;
  diabetes_pedigree?: number;
}

export interface HeartPredictionInput {
  age: number;
  sex: number;
  chest_pain_type: number;
  resting_bp: number;
  cholesterol: number;
  max_heart_rate?: number;
  exercise_angina?: number;
  st_depression?: number;
}

// ─── Reports ─────────────────────────────────────────────────
export type ReportStatus = "pending" | "processing" | "completed" | "failed";

export interface MedicalReport {
  id: string;
  file_name: string;
  status: ReportStatus;
  uploaded_at: string;
  analyzed_at?: string;
  ai_analysis?: string;
  file_size?: number;
  download_url?: string;
}

// ─── Chatbot ─────────────────────────────────────────────────
export interface ChatMessage {
  role: "user" | "model";
  content: string;
}

export interface ChatSession {
  id: string;
  title: string;
  message_count: number;
  updated_at: string;
}

// ─── Notifications ───────────────────────────────────────────
export interface Notification {
  id: string;
  title: string;
  message: string;
  type: "info" | "warning" | "alert" | "success";
  is_read: boolean;
  created_at: string;
}

// ─── Dashboard ───────────────────────────────────────────────
export interface DashboardData {
  summary: {
    total_records: number;
    total_reports: number;
    unread_notifications: number;
    active_predictions: number;
  };
  vitals_timeline: Array<{
    date: string;
    systolic?: number;
    diastolic?: number;
    glucose?: number;
    heart_rate?: number;
  }>;
  recent_predictions: Prediction[];
  latest_vitals: {
    blood_pressure?: string;
    glucose?: number;
    heart_rate?: number;
    date?: string;
  };
}

import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

export const api = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
});

// Attach token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto-refresh on 401
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const refresh = localStorage.getItem("refresh_token");
        const { data } = await axios.post(`${API_BASE}/auth/refresh`, { refresh_token: refresh });
        localStorage.setItem("access_token", data.access_token);
        original.headers.Authorization = `Bearer ${data.access_token}`;
        return api(original);
      } catch {
        localStorage.clear();
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

// ─── Auth ────────────────────────────────────────────────────
export const authAPI = {
  register: (data: any) => api.post("/auth/register", data),
  login: (email: string, password: string) => api.post("/auth/login", { email, password }),
  me: () => api.get("/auth/me"),
};

// ─── Health ──────────────────────────────────────────────────
export const healthAPI = {
  createRecord: (data: any) => api.post("/health/records", data),
  getRecords: (limit = 30) => api.get(`/health/records?limit=${limit}`),
};

// ─── Predictions ─────────────────────────────────────────────
export const predictionsAPI = {
  diabetes: (data: any) => api.post("/predictions/diabetes", data),
  heartDisease: (data: any) => api.post("/predictions/heart-disease", data),
  generalHealth: (data: any) => api.post("/predictions/general-health", data),
  history: () => api.get("/predictions/history"),
};

// ─── Reports ─────────────────────────────────────────────────
export const reportsAPI = {
  upload: (file: File) => {
    const form = new FormData();
    form.append("file", file);
    return api.post("/reports/upload", form, { headers: { "Content-Type": "multipart/form-data" } });
  },
  list: () => api.get("/reports/"),
  get: (id: string) => api.get(`/reports/${id}`),
};

// ─── Chatbot ─────────────────────────────────────────────────
export const chatbotAPI = {
  sendMessage: (message: string, session_id?: string) =>
    api.post("/chatbot/message", { message, session_id }),
  listSessions: () => api.get("/chatbot/sessions"),
  getSession: (id: string) => api.get(`/chatbot/sessions/${id}`),
};

// ─── Dashboard ───────────────────────────────────────────────
export const dashboardAPI = {
  patient: () => api.get("/dashboard/patient"),
  admin: () => api.get("/dashboard/admin"),
};

// ─── Notifications ───────────────────────────────────────────
export const notificationsAPI = {
  list: (unread_only = false) => api.get(`/notifications/?unread_only=${unread_only}`),
  markRead: (id: string) => api.put(`/notifications/${id}/read`),
  markAllRead: () => api.put("/notifications/read-all"),
};

// ─── Users ───────────────────────────────────────────────────
export const usersAPI = {
  getProfile: () => api.get("/users/profile"),
  updateProfile: (data: any) => api.put("/users/profile", data),
};

// ─── Doctor ──────────────────────────────────────────────────
export const doctorAPI = {
  listPatients: () => api.get("/doctor/patients"),
  getPatientRecords: (id: string) => api.get(`/doctor/patients/${id}/records`),
};

// ─── Admin ───────────────────────────────────────────────────
export const adminAPI = {
  listUsers: () => api.get("/admin/users"),
  toggleUser: (id: string) => api.put(`/admin/users/${id}/toggle-active`),
  stats: () => api.get("/admin/stats"),
};

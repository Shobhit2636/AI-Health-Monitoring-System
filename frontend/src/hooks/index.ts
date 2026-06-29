import { useEffect, useRef, useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { authAPI } from "../services/api";

// ─── useAuth ────────────────────────────────────────────────
export function useAuth() {
  const { user, isAuthenticated, login, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = useCallback(() => {
    logout();
    navigate("/login");
  }, [logout, navigate]);

  const checkAuth = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      await authAPI.me();
    } catch {
      handleLogout();
    }
  }, [isAuthenticated, handleLogout]);

  return { user, isAuthenticated, logout: handleLogout, checkAuth };
}


// ─── useWebSocket ────────────────────────────────────────────
type WSMessage = { type: string; title?: string; message?: string; notif_type?: string };

export function useWebSocket(userId: string | undefined) {
  const wsRef      = useRef<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WSMessage | null>(null);

  useEffect(() => {
    if (!userId) return;

    const WS_URL = import.meta.env.VITE_WS_URL || "ws://localhost:8000";
    const ws = new WebSocket(`${WS_URL}/ws/${userId}`);
    wsRef.current = ws;

    ws.onopen  = () => setConnected(true);
    ws.onclose = () => setConnected(false);
    ws.onerror = () => setConnected(false);
    ws.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data) as WSMessage;
        setLastMessage(data);
      } catch {}
    };

    return () => { ws.close(); };
  }, [userId]);

  const send = useCallback((msg: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(msg);
    }
  }, []);

  return { connected, lastMessage, send };
}


// ─── useLocalStorage ─────────────────────────────────────────
export function useLocalStorage<T>(key: string, defaultValue: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch {
      return defaultValue;
    }
  });

  const setStoredValue = useCallback((val: T | ((prev: T) => T)) => {
    setValue((prev) => {
      const newVal = typeof val === "function" ? (val as (p: T) => T)(prev) : val;
      localStorage.setItem(key, JSON.stringify(newVal));
      return newVal;
    });
  }, [key]);

  return [value, setStoredValue] as const;
}


// ─── useDebounce ─────────────────────────────────────────────
export function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}


// ─── usePagination ───────────────────────────────────────────
export function usePagination(totalItems: number, itemsPerPage: number = 10) {
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const goToPage   = (page: number) => setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  const nextPage   = () => goToPage(currentPage + 1);
  const prevPage   = () => goToPage(currentPage - 1);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex   = Math.min(startIndex + itemsPerPage, totalItems);

  return { currentPage, totalPages, goToPage, nextPage, prevPage, startIndex, endIndex };
}

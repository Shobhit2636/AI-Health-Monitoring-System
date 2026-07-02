import React, { useState, useRef, useEffect } from "react";
import { Send, MessageCircle, Plus, Bot, User as UserIcon } from "lucide-react";
import toast from "react-hot-toast";
import { chatbotAPI } from "../services/api";

interface ChatMessage { role: "user" | "model"; content: string; }
interface ChatSession  { id: string; title: string; message_count: number; updated_at: string; }

export default function Chatbot() {
  const [sessions, setSessions]         = useState<ChatSession[]>([]);
  const [activeSession, setActiveSession] = useState<string | null>(null);
  const [messages, setMessages]         = useState<ChatMessage[]>([]);
  const [input, setInput]               = useState("");
  const [loading, setLoading]           = useState(false);
  const messagesEndRef                  = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatbotAPI.listSessions().then((r) => setSessions(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadSession = async (id: string) => {
    try {
      const r = await chatbotAPI.getSession(id);
      setActiveSession(id);
      setMessages(r.data.messages || []);
    } catch { toast.error("Session load nahi hua."); }
  };

  const newSession = () => {
    setActiveSession(null);
    setMessages([{ role: "model", content: "Hello! I'm HealthBot 🏥\n\nMain aapke health questions ka jawab de sakta hoon. Puchho:\n• Symptoms ke baare mein\n• Diet aur exercise tips\n• Medicines ke baare mein\n• Test results explain karne ke liye\n\nKya jaanna chahte ho?" }]);
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg: ChatMessage = { role: "user", content: input };
    setMessages((m) => [...m, userMsg]);
    const currentInput = input;
    setInput("");
    setLoading(true);
    try {
      const r = await chatbotAPI.sendMessage(currentInput, activeSession || undefined);
      const { session_id, response } = r.data;
      if (!activeSession) {
        setActiveSession(session_id);
        chatbotAPI.listSessions().then((r) => setSessions(r.data));
      }
      setMessages((m) => [...m, { role: "model", content: response }]);
    } catch {
      toast.error("Message send nahi hua.");
      setMessages((m) => m.slice(0, -1));
      setInput(currentInput);
    } finally { setLoading(false); }
  };

  const QUICK_QUESTIONS = [
    "Mujhe diabetes hai, kya khana chahiye?",
    "My blood pressure is 150/95, is it dangerous?",
    "Roz kitna paani peena chahiye?",
    "Heart attack ke symptoms kya hote hain?",
  ];

  return (
    <div className="flex h-[calc(100vh-6rem)] gap-4">
      {/* Sidebar */}
      <div className="w-60 flex-shrink-0 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col">
        <div className="p-4 border-b border-gray-100 dark:border-gray-700">
          <button onClick={newSession}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-all">
            <Plus size={15} /> New Chat
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {sessions.map((s) => (
            <button key={s.id} onClick={() => loadSession(s.id)}
              className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-all ${
                activeSession === s.id
                  ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium"
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
              }`}>
              <p className="truncate">{s.title}</p>
              <p className="text-xs text-gray-400">{s.message_count} messages</p>
            </button>
          ))}
          {sessions.length === 0 && <p className="text-xs text-gray-400 dark:text-gray-500 text-center py-4">No conversations yet</p>}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center">
            <Bot size={18} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">HealthBot AI</p>
            <p className="text-xs text-green-500 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block"/> Powered by Gemini
            </p>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {messages.length === 0 && !activeSession && (
            <div className="text-center py-10">
              <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <MessageCircle size={30} className="text-blue-500" />
              </div>
              <h3 className="font-medium text-gray-800 dark:text-white mb-1">HealthBot se puchho kuch bhi</h3>
              <p className="text-sm text-gray-400 dark:text-gray-500 mb-6">Real Gemini AI se health guidance</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-md mx-auto">
                {QUICK_QUESTIONS.map((q) => (
                  <button key={q} onClick={() => setInput(q)}
                    className="text-left text-xs px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg hover:border-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 dark:hover:border-blue-700 text-gray-600 dark:text-gray-400 transition-all">
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
              <div className={`w-7 h-7 rounded-xl flex-shrink-0 flex items-center justify-center ${msg.role === "user" ? "bg-blue-600" : "bg-gray-100 dark:bg-gray-700"}`}>
                {msg.role === "user"
                  ? <UserIcon size={14} className="text-white" />
                  : <Bot size={14} className="text-gray-600 dark:text-gray-300" />}
              </div>
              <div className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                msg.role === "user"
                  ? "bg-blue-600 text-white rounded-tr-md"
                  : "bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-tl-md border border-gray-100 dark:border-gray-600"
              }`}>
                {msg.content}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex gap-3">
              <div className="w-7 h-7 rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                <Bot size={14} className="text-gray-600 dark:text-gray-300" />
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 border border-gray-100 dark:border-gray-600 px-4 py-3 rounded-2xl rounded-tl-md">
                <div className="flex gap-1 items-center h-4">
                  {[0,1,2].map((i) => (
                    <div key={i} className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                  ))}
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-gray-100 dark:border-gray-700">
          <div className="flex gap-3 items-end">
            <textarea value={input} onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
              placeholder="Health question puchho... (Enter to send)"
              rows={1}
              className="flex-1 px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 max-h-32" />
            <button onClick={sendMessage} disabled={!input.trim() || loading}
              className="p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all disabled:opacity-40 flex-shrink-0">
              <Send size={16} />
            </button>
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 text-center">
            HealthBot provides general information only — not medical advice.
          </p>
        </div>
      </div>
    </div>
  );
}

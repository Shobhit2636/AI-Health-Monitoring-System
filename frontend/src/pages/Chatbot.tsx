import React, { useState, useRef, useEffect } from "react";
import { Send, MessageCircle, Plus, Bot, User as UserIcon } from "lucide-react";
import toast from "react-hot-toast";
import { chatbotAPI } from "../services/api";
import { ChatMessage, ChatSession } from "../types";

export default function Chatbot() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSession, setActiveSession] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatbotAPI.listSessions()
      .then((r) => setSessions(r.data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadSession = async (id: string) => {
    try {
      const r = await chatbotAPI.getSession(id);
      setActiveSession(id);
      setMessages(r.data.messages || []);
    } catch {
      toast.error("Failed to load session.");
    }
  };

  const newSession = () => {
    setActiveSession(null);
    setMessages([{
      role: "model",
      content: "Hello! I'm HealthBot, your AI health assistant. How can I help you today? You can ask me about symptoms, medications, lifestyle tips, or general health questions.",
    }]);
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
        const sessions_r = await chatbotAPI.listSessions();
        setSessions(sessions_r.data);
      }

      setMessages((m) => [...m, { role: "model", content: response }]);
    } catch (err: any) {
      toast.error("Failed to send message.");
      setMessages((m) => m.slice(0, -1));
      setInput(currentInput);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const QUICK_QUESTIONS = [
    "What does high blood pressure mean?",
    "How to control diabetes naturally?",
    "Signs of a heart attack?",
    "How much water should I drink daily?",
  ];

  return (
    <div className="flex h-[calc(100vh-6rem)] gap-4">
      {/* Sidebar */}
      <div className="w-60 flex-shrink-0 bg-white rounded-xl border border-gray-100 shadow-sm flex flex-col">
        <div className="p-4 border-b border-gray-100">
          <button
            onClick={newSession}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-all"
          >
            <Plus size={15} /> New Chat
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {sessions.map((s) => (
            <button
              key={s.id}
              onClick={() => loadSession(s.id)}
              className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-all ${
                activeSession === s.id
                  ? "bg-blue-50 text-blue-700 font-medium"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <p className="truncate">{s.title}</p>
              <p className="text-xs text-gray-400">{s.message_count} messages</p>
            </button>
          ))}
          {sessions.length === 0 && (
            <p className="text-xs text-gray-400 text-center py-4">No conversations yet</p>
          )}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 bg-white rounded-xl border border-gray-100 shadow-sm flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center">
            <Bot size={18} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">HealthBot</p>
            <p className="text-xs text-green-500 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block"/> Online
            </p>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {messages.length === 0 && !activeSession && (
            <div className="text-center py-10">
              <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <MessageCircle size={30} className="text-blue-500" />
              </div>
              <h3 className="font-medium text-gray-800 mb-1">Ask HealthBot anything</h3>
              <p className="text-sm text-gray-400 mb-6">Get instant AI-powered health guidance</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-md mx-auto">
                {QUICK_QUESTIONS.map((q) => (
                  <button
                    key={q}
                    onClick={() => { setInput(q); }}
                    className="text-left text-xs px-3 py-2.5 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 text-gray-600 transition-all"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
              <div className={`w-7 h-7 rounded-xl flex-shrink-0 flex items-center justify-center ${
                msg.role === "user" ? "bg-blue-600" : "bg-gray-100"
              }`}>
                {msg.role === "user"
                  ? <UserIcon size={14} className="text-white" />
                  : <Bot size={14} className="text-gray-600" />
                }
              </div>
              <div className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-blue-600 text-white rounded-tr-md"
                  : "bg-gray-50 text-gray-800 rounded-tl-md border border-gray-100"
              }`}>
                {msg.content.split("\n").map((line, j) => (
                  <p key={j} className={j > 0 ? "mt-1" : ""}>{line}</p>
                ))}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex gap-3">
              <div className="w-7 h-7 rounded-xl bg-gray-100 flex items-center justify-center">
                <Bot size={14} className="text-gray-600" />
              </div>
              <div className="bg-gray-50 border border-gray-100 px-4 py-3 rounded-2xl rounded-tl-md">
                <div className="flex gap-1 items-center h-4">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                  ))}
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-gray-100">
          <div className="flex gap-3 items-end">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask a health question... (Enter to send)"
              rows={1}
              className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 max-h-32"
              style={{ height: "auto" }}
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || loading}
              className="p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all disabled:opacity-40 flex-shrink-0"
            >
              <Send size={16} />
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-2 text-center">
            HealthBot provides general information only — not medical advice.
          </p>
        </div>
      </div>
    </div>
  );
}

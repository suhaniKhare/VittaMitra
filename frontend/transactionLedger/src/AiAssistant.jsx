/**
 * VittaMitra — Full React Frontend
 *
 * Features:
 *  ✓ Vita AI chat powered by Anthropic Claude (via Express backend)
 *  ✓ 🎙️ Mic input via Web Speech API — tap mic, speak, auto-fills input
 *  ✓ Natural language expense logging sent to backend for AI parsing
 *  ✓ Live backend health check with offline fallback mode
 *  ✓ Real-time budget bars, stat cards, health gauge
 *  ✓ Transaction ledger with paymentMode and category tags
 *  ✓ Alert dismissal, profile dropdown, bottom navigation
 *
 * Backend setup:
 *   cd vittamitra-backend
 *   npm install
 *   echo "ANTHROPIC_API_KEY=sk-ant-..." > .env
 *   node server.js   (runs on http://localhost:4000)
 *
 * Frontend setup (Vite or CRA):
 *   Place this file as src/App.jsx
 *   npm run dev
 */

import { useState, useRef, useEffect, useCallback } from "react";

// ─── CONFIG ───────────────────────────────────────────────────────────────────
const API_BASE = "http://localhost:5000/api";

// ─── INITIAL DATA (used as fallback when backend is offline) ──────────────────
const INIT_TRANSACTIONS = [
  {
    id: 1,
    desc: "HP Fuel Pump",
    category: "Transport",
    subCategory: "Fuel",
    amount: -4500,
    date: "2025-06-09",
    time: "9:02 AM",
    icon: "⛽",
    paymentMode: "UPI",
  },
  {
    id: 2,
    desc: "Swiggy Dinner",
    category: "Dining",
    subCategory: "Delivery",
    amount: -850,
    date: "2025-06-08",
    time: "8:45 PM",
    icon: "🍔",
    paymentMode: "UPI",
  },
  {
    id: 3,
    desc: "Salary Credit",
    category: "Income",
    subCategory: null,
    amount: 82000,
    date: "2025-06-01",
    time: "9:00 AM",
    icon: "💼",
    paymentMode: "Bank Transfer",
  },
  {
    id: 4,
    desc: "Amazon Fresh",
    category: "Groceries",
    subCategory: null,
    amount: -1200,
    date: "2025-06-07",
    time: "3:10 PM",
    icon: "🛒",
    paymentMode: "Card",
  },
  {
    id: 5,
    desc: "Netflix",
    category: "Subscriptions",
    subCategory: null,
    amount: -649,
    date: "2025-06-05",
    time: "12:00 AM",
    icon: "📺",
    paymentMode: "Card",
  },
  {
    id: 6,
    desc: "Cafe Coffee Day",
    category: "Dining",
    subCategory: "Cafe",
    amount: -320,
    date: "2025-06-06",
    time: "11:20 AM",
    icon: "☕",
    paymentMode: "UPI",
  },
  {
    id: 7,
    desc: "Ola Cab",
    category: "Transport",
    subCategory: "Cab",
    amount: -250,
    date: "2025-06-07",
    time: "7:30 AM",
    icon: "🚕",
    paymentMode: "Wallet",
  },
  {
    id: 8,
    desc: "Big Basket",
    category: "Groceries",
    subCategory: null,
    amount: -1890,
    date: "2025-06-04",
    time: "5:15 PM",
    icon: "🧺",
    paymentMode: "UPI",
  },
];

const INIT_BUDGET = [
  {
    label: "Transport",
    used: 68,
    color: "#6366f1",
    icon: "🚗",
    spent: 5440,
    limit: 8000,
  },
  {
    label: "Dining",
    used: 88,
    color: "#f59e0b",
    icon: "🍽️",
    spent: 4400,
    limit: 5000,
  },
  {
    label: "Groceries",
    used: 42,
    color: "#10b981",
    icon: "🛒",
    spent: 3090,
    limit: 7500,
  },
  {
    label: "Subscriptions",
    used: 55,
    color: "#8b5cf6",
    icon: "📱",
    spent: 1650,
    limit: 3000,
  },
];

const INIT_ALERTS = [
  {
    id: 1,
    type: "danger",
    icon: "🔥",
    title: "Fuel spend 40% above average",
    sub: "You spent ₹4,500 — usual is ₹3,200. Want to review?",
  },
  {
    id: 2,
    type: "warning",
    icon: "⚠️",
    title: "Dining budget almost full",
    sub: "₹4,400 used of ₹5,000 — only ₹600 left.",
  },
];

const FALLBACK_REPLIES = {
  "this month's balance":
    "Your balance this month is ₹27,680. You received ₹82,000 salary and spent ₹54,320 so far. Saving at 18% — great going, Rahul! 💪",
  "top spending":
    "Top spending this month:\n1. 🍽️ Dining — ₹4,400 (88% of budget)\n2. 🚗 Transport — ₹5,440 (68%)\n3. 🛒 Groceries — ₹3,090 (42%)\n4. 📱 Subscriptions — ₹1,650 (55%)\n\nWatch that Dining budget!",
  "savings check":
    "Savings snapshot:\n💰 Net savings: ₹27,680\n📈 Rate: 18%\n🎯 Goal: 20%\n\nYou're 2% short. Cut ₹1,640 from extras to hit your target!",
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const fmt = (n) => (n < 0 ? "−₹" : "₹") + Math.abs(n).toLocaleString("en-IN");

async function api(path, opts = {}) {
  const res = await fetch(API_BASE + path, {
    headers: { "Content-Type": "application/json" },
    ...opts,
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

const BUDGET_COLORS = {
  Transport: "#6366f1",
  Dining: "#f59e0b",
  Groceries: "#10b981",
  Subscriptions: "#8b5cf6",
};
const BUDGET_ICONS = {
  Transport: "🚗",
  Dining: "🍽️",
  Groceries: "🛒",
  Subscriptions: "📱",
};

// ─── SUB-COMPONENTS ───────────────────────────────────────────────────────────
function HealthGauge({ score }) {
  const r = 54,
    cx = 70,
    cy = 70,
    circ = Math.PI * r;
  const color = score >= 75 ? "#10b981" : score >= 50 ? "#6366f1" : "#ef4444";
  return (
    <svg width="140" height="90" viewBox="0 0 140 90">
      <path
        d={`M${cx - r},${cy} A${r},${r} 0 0,1 ${cx + r},${cy}`}
        fill="none"
        stroke="#e5e7eb"
        strokeWidth="10"
        strokeLinecap="round"
      />
      <path
        d={`M${cx - r},${cy} A${r},${r} 0 0,1 ${cx + r},${cy}`}
        fill="none"
        stroke={color}
        strokeWidth="10"
        strokeLinecap="round"
        strokeDasharray={`${(score / 100) * circ} ${circ}`}
        style={{ transition: "stroke-dasharray 1.2s ease" }}
      />
      <text
        x={cx}
        y={cy - 8}
        textAnchor="middle"
        fontSize="26"
        fontWeight="700"
        fill="#1e1b4b"
      >
        {score}
      </text>
    </svg>
  );
}

function BudgetBar({ label, used, color, icon, spent, limit }) {
  const [hov, setHov] = useState(false);
  const over = used >= 80;
  return (
    <div
      style={{ marginBottom: 10 }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 3,
        }}
      >
        <span
          style={{
            fontSize: 12,
            color: "#6b7280",
            display: "flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          {icon} {label}
        </span>
        <span
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: over ? "#ef4444" : "#111827",
          }}
        >
          {used}%
        </span>
      </div>
      <div
        style={{
          height: 6,
          borderRadius: 99,
          background: "#f3f4f6",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${Math.min(used, 100)}%`,
            borderRadius: 99,
            background: hov ? (over ? "#dc2626" : "#6366f1") : color,
            transition: "width 0.8s ease,background 0.2s",
          }}
        />
      </div>
      {hov && spent != null && (
        <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 2 }}>
          ₹{spent?.toLocaleString("en-IN")} of ₹{limit?.toLocaleString("en-IN")}
        </div>
      )}
    </div>
  );
}

function TypingDots() {
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 8 }}>
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: "50%",
          background: "#ede9fe",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 12,
        }}
      >
        ₹
      </div>
      <div
        style={{
          background: "#f9f9fb",
          border: "1px solid #ede9fe",
          borderRadius: "14px 14px 14px 4px",
          padding: "12px 16px",
          display: "flex",
          gap: 5,
          alignItems: "center",
        }}
      >
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{
              width: 7,
              height: 7,
              borderRadius: "50%",
              background: "#6366f1",
              opacity: 0.4,
              animation: `vmdot 1.2s ease-in-out ${i * 0.2}s infinite`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

// ─── MIC BUTTON ───────────────────────────────────────────────────────────────
function MicButton({ onAudioReady, onListening }) {
  const [listening, setListening] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        onAudioReady(audioBlob);
        // Stop all tracks to release microphone
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setListening(true);
      onListening?.(true);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Microphone access denied or not supported on your browser/device.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
      setListening(false);
      onListening?.(false);
    }
  };

  const toggle = () => {
    if (listening) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  return (
    <button
      onClick={toggle}
      title={listening ? "Stop" : "Record Voice Command (🎙️)"}
      style={{
        width: 36,
        height: 36,
        borderRadius: "50%",
        border: "none",
        cursor: "pointer",
        flexShrink: 0,
        background: listening ? "#ef4444" : "#f3f4f6",
        color: listening ? "#fff" : "#6b7280",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 16,
        transition: "all 0.2s",
        animation: listening ? "vmmic 1.2s ease-in-out infinite" : "none",
      }}
    >
      {listening ? "⏹" : "🎙️"}
    </button>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function AiAssistant() {
  const [alerts, setAlerts] = useState(INIT_ALERTS);
  const [messages, setMessages] = useState([
    {
      from: "vita",
      text: "Namaste Rahul! 🙏 Tell me about a payment, ask about your budget, or tap 🎙️ and speak naturally.",
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [showLedger, setShowLedger] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [showProfile, setShowProfile] = useState(false);
  const [transactions, setTransactions] = useState(INIT_TRANSACTIONS);
  const [budget, setBudget] = useState(INIT_BUDGET);
  const [summary, setSummary] = useState({
    income: 82000,
    expenses: 54320,
    savings: 27680,
    savingsRate: 18,
    healthScore: 72,
  });
  const [backendUp, setBackendUp] = useState(null);

  const chatEnd = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    chatEnd.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Check backend & load live data
  useEffect(() => {
    (async () => {
      try {
        await api("/health");
        setBackendUp(true);
        const [txRes, sumRes] = await Promise.all([
          api("/transactions"),
          api("/summary"),
        ]);
        if (txRes.transactions?.length) setTransactions(txRes.transactions);
        if (sumRes.budgetUsage?.length) {
          setBudget(
            sumRes.budgetUsage.map((b) => ({
              ...b,
              color: BUDGET_COLORS[b.label] || "#6366f1",
              icon: BUDGET_ICONS[b.label] || "📦",
            })),
          );
        }
        if (sumRes.income) setSummary(sumRes);
      } catch {
        setBackendUp(false);
      }
    })();
  }, []);

  const addMsg = (from, text) =>
    setMessages((prev) => [...prev, { from, text }]);

  const sendMessage = async (overrideText) => {
    const msg = (overrideText ?? input).trim();
    if (!msg) return;
    setInput("");
    addMsg("user", msg);
    setIsTyping(true);

    try {
      if (backendUp) {
        const isExpense =
          /paid|spent|bought|purchased|₹|\d+\s*(rs|rupee)/i.test(msg);
        let warning = "";

        if (isExpense) {
          try {
            const logRes = await api("/log-expense", {
              method: "POST",
              body: JSON.stringify({ text: msg }),
            });
            if (logRes.transaction)
              setTransactions((prev) => [logRes.transaction, ...prev]);
            if (logRes.budgetWarning) warning = "\n\n" + logRes.budgetWarning;
          } catch (e) {
            /* log silently */
          }
        }

        const chatRes = await api("/chat", {
          method: "POST",
          body: JSON.stringify({ message: msg, history: messages.slice(-8) }),
        });
        setIsTyping(false);
        addMsg("vita", chatRes.reply + warning);
      } else {
        // Offline fallback
        await new Promise((r) => setTimeout(r, 800));
        const key = msg.toLowerCase();
        const reply =
          FALLBACK_REPLIES[key] ||
          `Got it! I noted "${msg}".\n\n(Vita's full AI is offline — start server.js for Claude responses.) 💡`;
        setIsTyping(false);
        addMsg("vita", reply);
      }
    } catch {
      setIsTyping(false);
      addMsg("vita", "Sorry, something went wrong. Please try again. 🙏");
    }
  };

  const handleAudioReady = async (blob) => {
    setIsTyping(true);
    addMsg("user", "🎙️ [Voice transaction recorded]");

    const formData = new FormData();
    formData.append("audio", blob, "recording.webm");
    formData.append("userId", "demo-user");

    try {
      const response = await fetch(`${API_BASE}/ledger/translate-voice`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Voice translation request failed");
      const data = await response.json();

      setIsTyping(false);

      // 1. Voice confirmation reply
      if (data.confirmationMessage) {
        addMsg("vita", data.confirmationMessage);

        // Optional out-loud voice synthesis
        if (typeof window !== "undefined" && window.speechSynthesis) {
          const utterance = new SpeechSynthesisUtterance(data.confirmationMessage);
          utterance.lang = "hi-IN";
          window.speechSynthesis.speak(utterance);
        }
      }

      // 2. Map new database transactions to UI
      if (data.databaseRecord?.transactions) {
        const formatted = data.databaseRecord.transactions.map((tx) => {
          const isExpense = tx.type === "expense";
          return {
            id: tx._id || Math.random(),
            desc: tx.description || tx.source || "Transaction",
            category: tx.category,
            subCategory: null,
            amount: isExpense ? -tx.amount : tx.amount,
            date: tx.date,
            time: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
            icon: tx.type === "income" ? "💼" : BUDGET_ICONS[tx.category] || "🛒",
            paymentMode: tx.mode,
          };
        });
        setTransactions((prev) => [...formatted, ...prev]);
      }

      // 3 & 4. Update dashboard metrics, health score & budget status dynamically by calling fresh summary
      try {
        const sumRes = await api("/summary");
        if (sumRes.income !== undefined) {
          // Sync healthScore with the latest value returned from daily snapshot
          if (data.advancedOutputs?.dailyFinancialSnapshot) {
            sumRes.healthScore = data.advancedOutputs.dailyFinancialSnapshot.financialHealthScore;
          }
          setSummary(sumRes);
        }
        if (sumRes.budgetUsage?.length) {
          setBudget(
            sumRes.budgetUsage.map((b) => ({
              ...b,
              color: BUDGET_COLORS[b.label] || "#6366f1",
              icon: BUDGET_ICONS[b.label] || "📦",
            })),
          );
        }
      } catch (err) {
        console.error("Error refreshing summary stats:", err);
      }

      // 5. Inject anomaly alerts
      if (data.advancedOutputs?.anomalyAlert) {
        const alertObj = data.advancedOutputs.anomalyAlert;
        setAlerts((prev) => [
          {
            id: Date.now(),
            type: "danger",
            icon: "🔥",
            title: alertObj.message || "Spending anomaly detected",
            sub: "Would you like to review this transaction?",
          },
          ...prev,
        ]);
      }
    } catch (error) {
      console.error("Failed to parse voice command:", error);
      setIsTyping(false);
      addMsg("vita", "Sorry, I couldn't translate that voice recording. Please verify your backend server is active. 🙏");
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f5f3ff",
        fontFamily: "'DM Sans',sans-serif",
      }}
    >
      <link
        href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap"
        rel="stylesheet"
      />
      <style>{`
        @keyframes vmdot  { 0%,80%,100%{transform:translateY(0)} 40%{transform:translateY(-6px)} }
        @keyframes vmmic  { 0%,100%{box-shadow:0 0 0 0 rgba(239,68,68,.4)} 50%{box-shadow:0 0 0 8px rgba(239,68,68,0)} }
        @keyframes vmfade { from{opacity:0;transform:translateY(5px)} to{opacity:1;transform:translateY(0)} }
        .vmanim { animation:vmfade 0.25s ease both; }
        *{box-sizing:border-box;}
        ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-thumb{background:#e5e7eb;border-radius:4px}
      `}</style>

      {/* ── HEADER ── */}
      <div
        style={{
          background: "#fff",
          borderBottom: "1px solid #e5e7eb",
          padding: "12px 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "sticky",
          top: 0,
          zIndex: 50,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: "#6366f1",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontWeight: 700,
              fontSize: 15,
            }}
          >
            ₹
          </div>
          <div>
            <div
              style={{
                fontWeight: 700,
                fontSize: 16,
                color: "#1e1b4b",
                lineHeight: 1.2,
              }}
            >
              VittaMitra
            </div>
            <div style={{ fontSize: 11, color: "#9ca3af" }}>
              Your money, your story
            </div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {backendUp !== null && (
            <span
              style={{
                background: backendUp ? "#ecfdf5" : "#fef2f2",
                color: backendUp ? "#059669" : "#dc2626",
                fontSize: 11,
                fontWeight: 600,
                padding: "3px 9px",
                borderRadius: 99,
              }}
            >
              {backendUp ? "✓ AI Online" : "⚠ Offline mode"}
            </span>
          )}
          <span
            style={{
              background: "#f3f4f6",
              color: "#6b7280",
              fontSize: 12,
              fontWeight: 500,
              padding: "4px 10px",
              borderRadius: 99,
            }}
          >
            June 2025
          </span>
          <button
            onClick={() => setShowProfile((p) => !p)}
            style={{
              width: 34,
              height: 34,
              borderRadius: 10,
              border: "1.5px solid #e5e7eb",
              background: showProfile ? "#6366f1" : "#fff",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: showProfile ? "#fff" : "#6b7280",
              transition: "all 0.2s",
              fontSize: 16,
            }}
          >
            👤
          </button>
        </div>
      </div>

      {/* ── PROFILE DROPDOWN ── */}
      {showProfile && (
        <>
          <div
            onClick={() => setShowProfile(false)}
            style={{ position: "fixed", inset: 0, zIndex: 98 }}
          />
          <div
            style={{
              position: "fixed",
              top: 68,
              right: 16,
              background: "#fff",
              border: "1px solid #e5e7eb",
              borderRadius: 14,
              padding: 16,
              width: 220,
              zIndex: 99,
              boxShadow: "0 4px 20px rgba(0,0,0,.1)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 12,
                paddingBottom: 12,
                borderBottom: "1px solid #f3f4f6",
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  background: "#ede9fe",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 700,
                  color: "#6366f1",
                  fontSize: 16,
                }}
              >
                R
              </div>
              <div>
                <div
                  style={{ fontWeight: 600, color: "#111827", fontSize: 14 }}
                >
                  Rahul Sharma
                </div>
                <div style={{ fontSize: 12, color: "#9ca3af" }}>
                  rahul@email.com
                </div>
              </div>
            </div>
            {[
              "Account Settings",
              "Linked Accounts",
              "Notifications",
              "Export Data",
              "Sign Out",
            ].map((item) => (
              <div
                key={item}
                onClick={() => setShowProfile(false)}
                style={{
                  padding: "8px 6px",
                  fontSize: 13,
                  color: item === "Sign Out" ? "#ef4444" : "#374151",
                  cursor: "pointer",
                  borderRadius: 6,
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "#f9fafb")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "transparent")
                }
              >
                {item}
              </div>
            ))}
          </div>
        </>
      )}

      {/* ── ALERTS ── */}
      <div
        style={{
          padding: "12px 16px 4px",
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
        {alerts.map((a) => (
          <div
            key={a.id}
            className="vmanim"
            style={{
              background: "#fff",
              border: `1px solid ${a.type === "danger" ? "#fecaca" : "#fde68a"}`,
              borderLeft: `4px solid ${a.type === "danger" ? "#ef4444" : "#f59e0b"}`,
              borderRadius: 12,
              padding: "11px 14px",
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: 10,
            }}
          >
            <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
              <span style={{ fontSize: 17 }}>{a.icon}</span>
              <div>
                <div
                  style={{ fontWeight: 600, color: "#111827", fontSize: 13 }}
                >
                  {a.title}
                </div>
                <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>
                  {a.sub}
                </div>
              </div>
            </div>
            <button
              onClick={() => setAlerts((p) => p.filter((x) => x.id !== a.id))}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "#9ca3af",
                fontSize: 20,
                padding: "0 4px",
                lineHeight: 1,
                flexShrink: 0,
              }}
            >
              ×
            </button>
          </div>
        ))}
      </div>

      {/* ── MAIN GRID ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 12,
          padding: "8px 16px 90px",
        }}
      >
        {/* LEFT: Vita Chat */}
        <div
          style={{
            background: "#fff",
            borderRadius: 16,
            border: "1px solid #e5e7eb",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            minHeight: 520,
          }}
        >
          {/* Chat header */}
          <div
            style={{
              padding: "12px 16px",
              borderBottom: "1px solid #f3f4f6",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              background: "#fafafa",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontWeight: 600,
                color: "#1e1b4b",
                fontSize: 14,
              }}
            >
              <span>✦</span> Vita — your money assistant
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                fontSize: 12,
                color: isListening ? "#ef4444" : "#10b981",
                fontWeight: 500,
              }}
            >
              <div
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  background: isListening ? "#ef4444" : "#10b981",
                  animation: isListening
                    ? "vmmic 1.2s ease-in-out infinite"
                    : "none",
                }}
              />
              {isListening ? "Listening…" : "Online"}
            </div>
          </div>

          {/* Messages */}
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "14px",
              display: "flex",
              flexDirection: "column",
              gap: 12,
              maxHeight: 340,
            }}
          >
            {messages.map((m, i) => (
              <div
                key={i}
                className="vmanim"
                style={{
                  display: "flex",
                  flexDirection: m.from === "user" ? "row-reverse" : "row",
                  alignItems: "flex-end",
                  gap: 8,
                }}
              >
                {m.from === "vita" && (
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      background: "#ede9fe",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 12,
                      flexShrink: 0,
                    }}
                  >
                    ₹
                  </div>
                )}
                <div
                  style={{
                    background: m.from === "user" ? "#6366f1" : "#f9f9fb",
                    color: m.from === "user" ? "#fff" : "#1e1b4b",
                    borderRadius:
                      m.from === "user"
                        ? "14px 14px 4px 14px"
                        : "14px 14px 14px 4px",
                    padding: "10px 13px",
                    fontSize: 13,
                    lineHeight: 1.55,
                    maxWidth: "80%",
                    border: m.from === "vita" ? "1px solid #ede9fe" : "none",
                    whiteSpace: "pre-line",
                  }}
                >
                  {m.text}
                </div>
                {m.from === "user" && (
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      background: "#6366f1",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 700,
                      color: "#fff",
                      fontSize: 12,
                      flexShrink: 0,
                    }}
                  >
                    R
                  </div>
                )}
              </div>
            ))}
            {isTyping && <TypingDots />}
            <div ref={chatEnd} />
          </div>

          {/* Quick replies */}
          <div
            style={{
              padding: "8px 14px",
              display: "flex",
              gap: 6,
              flexWrap: "wrap",
              borderTop: "1px solid #f9f9fb",
            }}
          >
            {["This month's balance", "Top spending", "Savings check"].map(
              (q) => (
                <button
                  key={q}
                  onClick={() => sendMessage(q)}
                  style={{
                    background: "#f3f4f6",
                    border: "1px solid #e5e7eb",
                    borderRadius: 99,
                    padding: "4px 11px",
                    fontSize: 11,
                    color: "#374151",
                    cursor: "pointer",
                    fontFamily: "inherit",
                    transition: "all .15s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#ede9fe";
                    e.currentTarget.style.color = "#6366f1";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "#f3f4f6";
                    e.currentTarget.style.color = "#374151";
                  }}
                >
                  {q}
                </button>
              ),
            )}
          </div>

          {/* Input row with MIC button */}
          <div
            style={{
              padding: "10px 14px",
              borderTop: "1px solid #f3f4f6",
              display: "flex",
              gap: 8,
              alignItems: "center",
            }}
          >
            <MicButton
              onAudioReady={handleAudioReady}
              onListening={setIsListening}
            />
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) =>
                e.key === "Enter" && !e.shiftKey && sendMessage()
              }
              placeholder={isListening ? "Listening…" : "Message Vita..."}
              style={{
                flex: 1,
                background: isListening ? "#fff8f8" : "#f9f9fb",
                border: `1px solid ${isListening ? "#fca5a5" : "#e5e7eb"}`,
                borderRadius: 99,
                padding: "9px 16px",
                fontSize: 13,
                color: "#111827",
                outline: "none",
                fontFamily: "inherit",
                transition: "all .2s",
              }}
            />
            <button
              onClick={() => sendMessage()}
              style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                border: "none",
                background: input.trim() ? "#6366f1" : "#e5e7eb",
                color: "#fff",
                cursor: input.trim() ? "pointer" : "default",
                fontSize: 14,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "background .2s",
                flexShrink: 0,
              }}
            >
              ↑
            </button>
          </div>
        </div>

        {/* RIGHT: Dashboard */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {/* Greeting */}
          <div
            style={{
              background: "linear-gradient(135deg,#6366f1 0%,#8b5cf6 100%)",
              borderRadius: 16,
              padding: "16px 18px",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div>
              <div style={{ fontWeight: 700, fontSize: 18 }}>
                Good morning, Rahul
              </div>
              <div style={{ fontSize: 12, opacity: 0.8, marginTop: 2 }}>
                Here's your financial snapshot for today
              </div>
            </div>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                background: "rgba(255,255,255,.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 700,
                fontSize: 16,
              }}
            >
              R
            </div>
          </div>

          {/* Stat cards */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: 8,
            }}
          >
            {[
              {
                label: "Monthly income",
                value: fmt(summary.income),
                badge: "↑ 4.2% vs last month",
                bc: "#10b981",
              },
              {
                label: "Total expenses",
                value: fmt(summary.expenses),
                badge: "↑ 12% vs last month",
                bc: "#ef4444",
              },
              {
                label: "Net savings",
                value: fmt(summary.savings),
                badge: `✓ ${summary.savingsRate}% savings rate`,
                bc: "#6366f1",
              },
            ].map((c) => (
              <div
                key={c.label}
                style={{
                  background: "#fff",
                  borderRadius: 12,
                  border: "1px solid #e5e7eb",
                  padding: "12px 10px 10px",
                  cursor: "default",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.borderColor = "#c7d2fe")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.borderColor = "#e5e7eb")
                }
              >
                <div
                  style={{ fontSize: 10, color: "#9ca3af", marginBottom: 4 }}
                >
                  {c.label}
                </div>
                <div
                  style={{ fontWeight: 700, fontSize: 16, color: "#111827" }}
                >
                  {c.value}
                </div>
                <div
                  style={{
                    fontSize: 10,
                    color: c.bc,
                    marginTop: 4,
                    fontWeight: 500,
                  }}
                >
                  {c.badge}
                </div>
              </div>
            ))}
          </div>

          {/* Health gauge + Budget bars */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1.5fr",
              gap: 8,
            }}
          >
            <div
              style={{
                background: "#fff",
                borderRadius: 12,
                border: "1px solid #e5e7eb",
                padding: "14px 10px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <HealthGauge score={summary.healthScore || 72} />
              <div
                style={{
                  fontWeight: 600,
                  color: "#1e1b4b",
                  fontSize: 13,
                  marginTop: -2,
                }}
              >
                Health score
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: "#10b981",
                  marginTop: 3,
                  fontWeight: 500,
                }}
              >
                👍 Good standing
              </div>
            </div>
            <div
              style={{
                background: "#fff",
                borderRadius: 12,
                border: "1px solid #e5e7eb",
                padding: "14px",
              }}
            >
              <div
                style={{
                  fontWeight: 600,
                  color: "#1e1b4b",
                  fontSize: 13,
                  marginBottom: 10,
                }}
              >
                Budget usage
              </div>
              {budget.map((b) => (
                <BudgetBar key={b.label} {...b} />
              ))}
            </div>
          </div>

          {/* Transaction ledger */}
          <div
            style={{
              background: "#fff",
              borderRadius: 12,
              border: "1px solid #e5e7eb",
              overflow: "hidden",
            }}
          >
            <button
              onClick={() => setShowLedger((p) => !p)}
              style={{
                width: "100%",
                background: "none",
                border: "none",
                padding: "13px 16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 16 }}>🗒️</span>
                <div style={{ textAlign: "left" }}>
                  <div
                    style={{ fontWeight: 600, color: "#1e1b4b", fontSize: 13 }}
                  >
                    Transaction ledger
                  </div>
                  <div style={{ fontSize: 11, color: "#9ca3af" }}>
                    {transactions.length} transactions · tap to view
                  </div>
                </div>
              </div>
              <span
                style={{
                  color: "#9ca3af",
                  fontSize: 18,
                  display: "inline-block",
                  transform: showLedger ? "rotate(180deg)" : "rotate(0)",
                  transition: "transform .2s",
                }}
              >
                ⌄
              </span>
            </button>

            {showLedger && (
              <div
                style={{
                  borderTop: "1px solid #f3f4f6",
                  maxHeight: 280,
                  overflowY: "auto",
                }}
              >
                {transactions.map((tx, i) => (
                  <div
                    key={tx.id}
                    style={{
                      padding: "10px 16px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      borderBottom:
                        i < transactions.length - 1
                          ? "1px solid #f9fafb"
                          : "none",
                      cursor: "pointer",
                      transition: "background .1s",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = "#fafaf9")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "transparent")
                    }
                  >
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 10 }}
                    >
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 9,
                          background: "#f3f4f6",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 15,
                        }}
                      >
                        {tx.icon}
                      </div>
                      <div>
                        <div
                          style={{
                            fontWeight: 500,
                            color: "#111827",
                            fontSize: 12,
                          }}
                        >
                          {tx.desc}
                        </div>
                        <div style={{ fontSize: 10, color: "#9ca3af" }}>
                          {tx.category}
                          {tx.subCategory ? ` → ${tx.subCategory}` : ""} ·{" "}
                          {String(tx.date || "")
                            .slice(5)
                            .replace("-", "/")}{" "}
                          {tx.time}
                        </div>
                      </div>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "flex-end",
                        gap: 2,
                      }}
                    >
                      <div
                        style={{
                          fontWeight: 600,
                          fontSize: 13,
                          color: tx.amount > 0 ? "#10b981" : "#1e1b4b",
                        }}
                      >
                        {fmt(tx.amount)}
                      </div>
                      {tx.paymentMode && (
                        <div style={{ fontSize: 9, color: "#9ca3af" }}>
                          {tx.paymentMode}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── BOTTOM NAV ── */}
      <div
        style={{
          background: "#fff",
          borderTop: "1px solid #e5e7eb",
          padding: "10px 0 14px",
          display: "flex",
          justifyContent: "space-around",
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 40,
        }}
      >
        {[
          { id: "overview", icon: "🏠", label: "Overview" },
          { id: "transactions", icon: "💳", label: "Transactions" },
          { id: "budget", icon: "📊", label: "Budget" },
          { id: "goals", icon: "🎯", label: "Goals" },
          { id: "settings", icon: "⚙️", label: "Settings" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 2,
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "4px 12px",
              borderRadius: 10,
              fontFamily: "inherit",
              transition: "background .15s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#f3f4f6")}
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "transparent")
            }
          >
            <span style={{ fontSize: 19 }}>{tab.icon}</span>
            <span
              style={{
                fontSize: 10,
                fontWeight: activeTab === tab.id ? 700 : 400,
                color: activeTab === tab.id ? "#6366f1" : "#9ca3af",
              }}
            >
              {tab.label}
            </span>
            {activeTab === tab.id && (
              <div
                style={{
                  width: 16,
                  height: 2,
                  borderRadius: 99,
                  background: "#6366f1",
                }}
              />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

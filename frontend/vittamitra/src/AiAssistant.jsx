import { useState, useRef, useEffect } from "react";

const TRANSACTIONS = [
  {
    id: 1,
    desc: "HP Fuel Pump",
    category: "Transport → Fuel",
    amount: -4500,
    date: "Jun 9",
    time: "9:02 AM",
    icon: "⛽",
  },
  {
    id: 2,
    desc: "Swiggy Dinner",
    category: "Dining → Delivery",
    amount: -850,
    date: "Jun 8",
    time: "8:45 PM",
    icon: "🍔",
  },
  {
    id: 3,
    desc: "Salary Credit",
    category: "Income",
    amount: 82000,
    date: "Jun 1",
    time: "9:00 AM",
    icon: "💼",
  },
  {
    id: 4,
    desc: "Amazon Fresh",
    category: "Groceries",
    amount: -1200,
    date: "Jun 7",
    time: "3:10 PM",
    icon: "🛒",
  },
  {
    id: 5,
    desc: "Netflix",
    category: "Subscriptions",
    amount: -649,
    date: "Jun 5",
    time: "12:00 AM",
    icon: "📺",
  },
  {
    id: 6,
    desc: "Cafe Coffee Day",
    category: "Dining → Cafe",
    amount: -320,
    date: "Jun 6",
    time: "11:20 AM",
    icon: "☕",
  },
  {
    id: 7,
    desc: "Ola Cab",
    category: "Transport → Cab",
    amount: -250,
    date: "Jun 7",
    time: "7:30 AM",
    icon: "🚕",
  },
  {
    id: 8,
    desc: "Big Basket",
    category: "Groceries",
    amount: -1890,
    date: "Jun 4",
    time: "5:15 PM",
    icon: "🧺",
  },
];

const BUDGET = [
  { label: "Transport", used: 68, color: "#6366f1", icon: "🚗" },
  { label: "Dining", used: 88, color: "#f59e0b", icon: "🍽️" },
  { label: "Groceries", used: 42, color: "#10b981", icon: "🛒" },
  { label: "Subscriptions", used: 55, color: "#8b5cf6", icon: "📱" },
];

const ALERTS = [
  {
    id: 1,
    type: "danger",
    icon: "🔥",
    title: "Fuel spend 40% above average",
    sub: "You spent ₹4,500 — usual is ₹3,200. Want to review?",
    dismissed: false,
  },
  {
    id: 2,
    type: "warning",
    icon: "⚠️",
    title: "Dining budget almost full",
    sub: "₹4,400 used of ₹5,000 — only ₹600 left.",
    dismissed: false,
  },
];

const VITA_RESPONSES = {
  "this month's balance":
    "Your balance this month is ₹27,680. You started June with ₹0 and received ₹82,000 salary. Total expenses so far are ₹54,320. You're saving at 18% — great going, Rahul! 💪",
  "top spending":
    "Your top spending categories this month:\n1. 🍽️ Dining — ₹4,400 (88% of budget)\n2. 🚗 Transport — ₹5,440 (68% of budget)\n3. 🛒 Groceries — ₹3,090 (42% of budget)\n4. 📱 Subscriptions — ₹1,650 (55% of budget)\n\nDining is almost at its limit — watch out!",
  "savings check":
    "Here's your savings snapshot:\n\n💰 Net savings: ₹27,680\n📈 Savings rate: 18%\n🎯 Goal: 20% rate\n\nYou're 2% short of your target. Cutting ₹1,640 from discretionary spending this month would hit the goal!",
  default:
    "Got it! I've logged that. Is there anything else you'd like to track or review? You can ask about your balance, spending breakdown, or savings anytime. 😊",
};

function formatAmount(n) {
  return (n < 0 ? "−₹" : "₹") + Math.abs(n).toLocaleString("en-IN");
}

function HealthGauge({ score }) {
  const r = 54,
    cx = 70,
    cy = 70;
  const circ = Math.PI * r;
  const dash = (score / 100) * circ;
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
        stroke="#6366f1"
        strokeWidth="10"
        strokeLinecap="round"
        strokeDasharray={`${dash} ${circ}`}
        style={{ transition: "stroke-dasharray 1s ease" }}
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

function BudgetBar({ label, used, color, icon }) {
  const [hovered, setHovered] = useState(false);
  const over = used >= 80;
  return (
    <div
      style={{ marginBottom: 10 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 4,
        }}
      >
        <span
          style={{
            fontSize: 13,
            color: "#6b7280",
            display: "flex",
            alignItems: "center",
            gap: 5,
          }}
        >
          <span>{icon}</span>
          {label}
        </span>
        <span
          style={{
            fontSize: 13,
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
            width: `${used}%`,
            borderRadius: 99,
            background: hovered ? (over ? "#dc2626" : "#6366f1") : color,
            transition: "width 0.8s ease, background 0.2s",
          }}
        />
      </div>
    </div>
  );
}

export default function VittaMitra() {
  const [alerts, setAlerts] = useState(ALERTS);
  const [chatMessages, setChatMessages] = useState([
    {
      from: "vita",
      text: "Namaste! Tell me about a payment, ask about your budget, or tap the mic and speak naturally.",
    },
    { from: "user", text: "Paid ₹4,500 for fuel at HP pump via UPI" },
    {
      from: "vita",
      text: "Got it! Logged ₹4,500 under Transport → Fuel.\n\n⚠ 40% above your usual spend.",
    },
  ]);
  const [input, setInput] = useState("");
  const [showLedger, setShowLedger] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [showProfile, setShowProfile] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const sendMessage = (text) => {
    const msg = text || input.trim();
    if (!msg) return;
    setInput("");
    setChatMessages((prev) => [...prev, { from: "user", text: msg }]);
    setTimeout(() => {
      const key = msg.toLowerCase();
      const reply = VITA_RESPONSES[key] || VITA_RESPONSES["default"];
      setChatMessages((prev) => [...prev, { from: "vita", text: reply }]);
    }, 700);
  };

  const dismissAlert = (id) =>
    setAlerts((prev) => prev.filter((a) => a.id !== id));

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f5f3ff",
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      <link
        href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap"
        rel="stylesheet"
      />

      {/* Header */}
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
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span
            style={{
              background: "#ecfdf5",
              color: "#059669",
              fontSize: 12,
              fontWeight: 600,
              padding: "4px 10px",
              borderRadius: 99,
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            ✓ Synced
          </span>
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
            onClick={() => setShowProfile(!showProfile)}
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

      {/* Profile Dropdown */}
      {showProfile && (
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
            zIndex: 100,
            boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
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
              }}
            >
              R
            </div>
            <div>
              <div style={{ fontWeight: 600, color: "#111827", fontSize: 14 }}>
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
                padding: "8px 4px",
                fontSize: 13,
                color: item === "Sign Out" ? "#ef4444" : "#374151",
                cursor: "pointer",
                borderRadius: 6,
                transition: "background 0.15s",
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
      )}

      {/* Alerts */}
      <div
        style={{
          padding: "12px 16px",
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
        {alerts.map((alert) => (
          <div
            key={alert.id}
            style={{
              background: "#fff",
              border: `1px solid ${alert.type === "danger" ? "#fecaca" : "#fde68a"}`,
              borderLeft: `4px solid ${alert.type === "danger" ? "#ef4444" : "#f59e0b"}`,
              borderRadius: 12,
              padding: "12px 16px",
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: 10,
            }}
          >
            <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
              <span style={{ fontSize: 18 }}>{alert.icon}</span>
              <div>
                <div
                  style={{ fontWeight: 600, color: "#111827", fontSize: 14 }}
                >
                  {alert.title}
                </div>
                <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>
                  {alert.sub}
                </div>
              </div>
            </div>
            <button
              onClick={() => dismissAlert(alert.id)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "#9ca3af",
                fontSize: 18,
                padding: 0,
                lineHeight: 1,
              }}
            >
              ×
            </button>
          </div>
        ))}
      </div>

      {/* Main Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 12,
          padding: "0 16px 16px",
        }}
      >
        {/* Left: Vita Chat */}
        <div
          style={{
            background: "#fff",
            borderRadius: 16,
            border: "1px solid #e5e7eb",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              padding: "12px 16px",
              borderBottom: "1px solid #f3f4f6",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
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
              <span style={{ fontSize: 16 }}>✦</span> Vita — your money
              assistant
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                fontSize: 12,
                color: "#10b981",
                fontWeight: 500,
              }}
            >
              <div
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  background: "#10b981",
                }}
              />{" "}
              Online
            </div>
          </div>

          {/* Messages */}
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "12px 14px",
              display: "flex",
              flexDirection: "column",
              gap: 12,
              minHeight: 240,
              maxHeight: 320,
            }}
          >
            {chatMessages.map((msg, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  flexDirection: msg.from === "user" ? "row-reverse" : "row",
                  alignItems: "flex-end",
                  gap: 8,
                }}
              >
                {msg.from === "vita" && (
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      background: "#ede9fe",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 13,
                      flexShrink: 0,
                    }}
                  >
                    ₹
                  </div>
                )}
                <div
                  style={{
                    background: msg.from === "user" ? "#6366f1" : "#f9f9fb",
                    color: msg.from === "user" ? "#fff" : "#1e1b4b",
                    borderRadius:
                      msg.from === "user"
                        ? "14px 14px 4px 14px"
                        : "14px 14px 14px 4px",
                    padding: "10px 13px",
                    fontSize: 13,
                    lineHeight: 1.5,
                    maxWidth: "80%",
                    border: msg.from === "vita" ? "1px solid #ede9fe" : "none",
                    whiteSpace: "pre-line",
                  }}
                >
                  {msg.text}
                </div>
                {msg.from === "user" && (
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      background: "#6366f1",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 12,
                      fontWeight: 700,
                      color: "#fff",
                      flexShrink: 0,
                    }}
                  >
                    R
                  </div>
                )}
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          {/* Quick Replies */}
          <div
            style={{
              padding: "8px 14px",
              display: "flex",
              gap: 6,
              flexWrap: "wrap",
            }}
          >
            {["This month's balance", "Top spending", "Savings check"].map(
              (q) => (
                <button
                  key={q}
                  onClick={() => sendMessage(q.toLowerCase())}
                  style={{
                    background: "#f3f4f6",
                    border: "1px solid #e5e7eb",
                    borderRadius: 99,
                    padding: "5px 12px",
                    fontSize: 12,
                    color: "#374151",
                    cursor: "pointer",
                    fontFamily: "inherit",
                    transition: "all 0.15s",
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

          {/* Input */}
          <div
            style={{
              padding: "10px 14px",
              borderTop: "1px solid #f3f4f6",
              display: "flex",
              gap: 8,
            }}
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Message Vita..."
              style={{
                flex: 1,
                background: "#f9f9fb",
                border: "1px solid #e5e7eb",
                borderRadius: 99,
                padding: "9px 16px",
                fontSize: 13,
                color: "#111827",
                outline: "none",
                fontFamily: "inherit",
              }}
            />
            <button
              onClick={() => sendMessage()}
              style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                background: "#6366f1",
                border: "none",
                color: "#fff",
                cursor: "pointer",
                fontSize: 16,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              ↑
            </button>
          </div>
        </div>

        {/* Right: Dashboard */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {/* Greeting */}
          <div
            style={{
              background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
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
                width: 38,
                height: 38,
                borderRadius: "50%",
                background: "rgba(255,255,255,0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 700,
                fontSize: 15,
              }}
            >
              R
            </div>
          </div>

          {/* Stat Cards */}
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
                value: "₹82,000",
                badge: "↑ 4.2% vs last month",
                badgeColor: "#10b981",
              },
              {
                label: "Total expenses",
                value: "₹54,320",
                badge: "↑ 12% vs last month",
                badgeColor: "#ef4444",
              },
              {
                label: "Net savings",
                value: "₹27,680",
                badge: "✓ 18% savings rate",
                badgeColor: "#6366f1",
              },
            ].map((c) => (
              <div
                key={c.label}
                style={{
                  background: "#fff",
                  borderRadius: 12,
                  border: "1px solid #e5e7eb",
                  padding: "12px 12px 10px",
                }}
              >
                <div
                  style={{ fontSize: 11, color: "#9ca3af", marginBottom: 4 }}
                >
                  {c.label}
                </div>
                <div
                  style={{ fontWeight: 700, fontSize: 17, color: "#111827" }}
                >
                  {c.value}
                </div>
                <div
                  style={{
                    fontSize: 10,
                    color: c.badgeColor,
                    marginTop: 4,
                    fontWeight: 500,
                  }}
                >
                  {c.badge}
                </div>
              </div>
            ))}
          </div>

          {/* Health + Budget */}
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
                padding: "14px 12px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <HealthGauge score={72} />
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
                  marginTop: 2,
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
                padding: "14px 14px",
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
              {BUDGET.map((b) => (
                <BudgetBar key={b.label} {...b} />
              ))}
            </div>
          </div>

          {/* Transaction Ledger Toggle */}
          <div
            style={{
              background: "#fff",
              borderRadius: 12,
              border: "1px solid #e5e7eb",
              overflow: "hidden",
            }}
          >
            <button
              onClick={() => setShowLedger(!showLedger)}
              style={{
                width: "100%",
                background: "none",
                border: "none",
                padding: "14px 16px",
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
                    style={{ fontWeight: 600, color: "#1e1b4b", fontSize: 14 }}
                  >
                    Transaction ledger
                  </div>
                  <div style={{ fontSize: 11, color: "#9ca3af" }}>
                    8 transactions · tap to view
                  </div>
                </div>
              </div>
              <span
                style={{
                  color: "#9ca3af",
                  fontSize: 18,
                  transform: showLedger ? "rotate(180deg)" : "rotate(0deg)",
                  transition: "transform 0.2s",
                }}
              >
                ⌄
              </span>
            </button>

            {showLedger && (
              <div style={{ borderTop: "1px solid #f3f4f6" }}>
                {TRANSACTIONS.map((tx, i) => (
                  <div
                    key={tx.id}
                    style={{
                      padding: "10px 16px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      borderBottom:
                        i < TRANSACTIONS.length - 1
                          ? "1px solid #f9fafb"
                          : "none",
                      cursor: "pointer",
                      transition: "background 0.1s",
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
                          width: 34,
                          height: 34,
                          borderRadius: 10,
                          background: "#f3f4f6",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 16,
                        }}
                      >
                        {tx.icon}
                      </div>
                      <div>
                        <div
                          style={{
                            fontWeight: 500,
                            color: "#111827",
                            fontSize: 13,
                          }}
                        >
                          {tx.desc}
                        </div>
                        <div style={{ fontSize: 11, color: "#9ca3af" }}>
                          {tx.category} · {tx.date}, {tx.time}
                        </div>
                      </div>
                    </div>
                    <div
                      style={{
                        fontWeight: 600,
                        fontSize: 14,
                        color: tx.amount > 0 ? "#10b981" : "#1e1b4b",
                      }}
                    >
                      {formatAmount(tx.amount)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Nav */}
      <div
        style={{
          background: "#fff",
          borderTop: "1px solid #e5e7eb",
          padding: "10px 0 16px",
          display: "flex",
          justifyContent: "space-around",
          position: "sticky",
          bottom: 0,
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
              gap: 3,
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "4px 12px",
              borderRadius: 10,
              transition: "background 0.15s",
              fontFamily: "inherit",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#f3f4f6")}
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "transparent")
            }
          >
            <span style={{ fontSize: 20 }}>{tab.icon}</span>
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
                  width: 18,
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

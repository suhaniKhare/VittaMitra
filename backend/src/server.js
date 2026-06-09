/**
 * VittaMitra Backend Server
 * ─────────────────────────
 * Express + Anthropic Claude API
 *
 * Setup:
 *   npm install express cors dotenv @anthropic-ai/sdk
 *   Create a .env file: ANTHROPIC_API_KEY=sk-ant-...
 *   node server.js
 *
 * Endpoints:
 *   POST /api/chat          → Vita AI chat (Claude)
 *   POST /api/log-expense   → Parse & log a natural-language expense
 *   GET  /api/transactions  → Fetch all transactions
 *   GET  /api/summary       → Monthly financial summary
 *   GET  /api/health        → Server health check
 */

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const Anthropic = require("@anthropic-ai/sdk");

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({ origin: ["http://localhost:3000", "http://localhost:5173"] }));
app.use(express.json());

const client = new Anthropic.default({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// ─── In-memory store (replace with DB in production) ─────────────────────────
let transactions = [
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

const budgetLimits = {
  Transport: 8000,
  Dining: 5000,
  Groceries: 7500,
  Subscriptions: 3000,
};

const VITA_SYSTEM_PROMPT = `You are Vita, an intelligent personal finance assistant built into VittaMitra — a money management app for Indian users.

Your personality:
- Warm, friendly, and encouraging. Use "Rahul" when addressing the user.
- Occasionally use Hindi words (Namaste, accha, bilkul) to feel local and familiar.
- Be concise but insightful. Format numbers in Indian style (₹1,00,000 not ₹100,000).
- Use emojis sparingly but effectively.

Your capabilities:
- Log payments and expenses from natural language ("Paid ₹500 at BigBazaar for groceries")
- Analyse spending patterns and give budget warnings
- Answer questions about the user's financial health
- Suggest ways to save money
- Provide insights on budget categories

Current financial context for Rahul (June 2025):
- Monthly Income: ₹82,000
- Total Expenses so far: ₹54,320
- Net Savings: ₹27,680 (18% savings rate)
- Health Score: 72/100
- Budget alerts: Dining at 88%, Transport at 68%, Groceries at 42%, Subscriptions at 55%
- Notable: Fuel spend is 40% above average this month

When user logs a payment (e.g. "Paid ₹X for Y"), always:
1. Confirm the log with the amount and category
2. Mention if it pushes any budget close to its limit
3. Give a brief tip or observation

Keep responses under 150 words unless the user asks for a detailed breakdown.`;

// ─── VITA CHAT ENDPOINT ───────────────────────────────────────────────────────
app.post("/api/chat", async (req, res) => {
  const { message, history = [] } = req.body;

  if (!message || !message.trim()) {
    return res.status(400).json({ error: "Message is required" });
  }

  try {
    const messages = [
      ...history.map((m) => ({
        role: m.from === "user" ? "user" : "assistant",
        content: m.text,
      })),
      { role: "user", content: message },
    ];

    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 300,
      system: VITA_SYSTEM_PROMPT,
      messages,
    });

    const reply = response.content[0].text;
    res.json({ reply, usage: response.usage });
  } catch (err) {
    console.error("Claude API error:", err.message);
    res
      .status(500)
      .json({ error: "Vita is unavailable right now. Please try again." });
  }
});

// ─── LOG EXPENSE FROM NATURAL LANGUAGE ───────────────────────────────────────
app.post("/api/log-expense", async (req, res) => {
  const { text } = req.body;

  if (!text) return res.status(400).json({ error: "text is required" });

  try {
    const extractPrompt = `Extract the expense details from this text and return ONLY a JSON object with these exact fields:
{
  "desc": "merchant or item name",
  "amount": number (negative for expense, positive for income),
  "category": one of ["Transport", "Dining", "Groceries", "Subscriptions", "Income", "Health", "Entertainment", "Utilities", "Other"],
  "subCategory": "optional subcategory or null",
  "icon": "single relevant emoji",
  "paymentMode": "UPI or Card or Cash or Wallet or Bank Transfer or null"
}

Text: "${text}"

Return ONLY the JSON, no explanation.`;

    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 200,
      messages: [{ role: "user", content: extractPrompt }],
    });

    let parsed;
    try {
      const raw = response.content[0].text.replace(/```json|```/g, "").trim();
      parsed = JSON.parse(raw);
    } catch {
      return res
        .status(422)
        .json({
          error: "Could not parse the expense. Please be more specific.",
        });
    }

    const now = new Date();
    const newTx = {
      id: transactions.length + 1,
      ...parsed,
      date: now.toISOString().split("T")[0],
      time: now.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    transactions.unshift(newTx);

    // Check budget impact
    const catSpend = transactions
      .filter((t) => t.category === parsed.category && t.amount < 0)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    const limit = budgetLimits[parsed.category];
    const budgetWarning =
      limit && catSpend > limit * 0.8
        ? `⚠️ ${parsed.category} budget is now at ${Math.round((catSpend / limit) * 100)}% — ₹${(limit - catSpend).toLocaleString("en-IN")} remaining.`
        : null;

    res.json({ transaction: newTx, budgetWarning });
  } catch (err) {
    console.error("Log expense error:", err.message);
    res.status(500).json({ error: "Failed to log expense." });
  }
});

// ─── GET ALL TRANSACTIONS ─────────────────────────────────────────────────────
app.get("/api/transactions", (req, res) => {
  res.json({ transactions, total: transactions.length });
});

// ─── MONTHLY SUMMARY ──────────────────────────────────────────────────────────
app.get("/api/summary", (req, res) => {
  const income = transactions
    .filter((t) => t.amount > 0)
    .reduce((s, t) => s + t.amount, 0);
  const expenses = transactions
    .filter((t) => t.amount < 0)
    .reduce((s, t) => s + Math.abs(t.amount), 0);
  const savings = income - expenses;
  const savingsRate = income > 0 ? Math.round((savings / income) * 100) : 0;

  const byCategory = {};
  transactions
    .filter((t) => t.amount < 0)
    .forEach((t) => {
      byCategory[t.category] =
        (byCategory[t.category] || 0) + Math.abs(t.amount);
    });

  const budgetUsage = Object.entries(budgetLimits).map(([cat, limit]) => ({
    label: cat,
    used: Math.round(((byCategory[cat] || 0) / limit) * 100),
    spent: byCategory[cat] || 0,
    limit,
  }));

  res.json({
    income,
    expenses,
    savings,
    savingsRate,
    budgetUsage,
    healthScore: 72,
  });
});

// ─── HEALTH CHECK ─────────────────────────────────────────────────────────────
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`\n🚀 VittaMitra backend running at http://localhost:${PORT}`);
  console.log(`   POST /api/chat          → Vita AI chat`);
  console.log(`   POST /api/log-expense   → Parse & log expense`);
  console.log(`   GET  /api/transactions  → All transactions`);
  console.log(`   GET  /api/summary       → Monthly summary\n`);
});

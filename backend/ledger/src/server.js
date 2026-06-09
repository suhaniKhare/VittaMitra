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

import Anthropic from "@anthropic-ai/sdk";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import connectDB from "./config/db.js";
import Transaction from "./models/Transaction.js";
import ledgerRoutes from "./routes/ledgerRoutes.js";
import { exec } from "child_process";

dotenv.config();


const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.use("/api/ledger", ledgerRoutes);

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

app.get("/api/test-db", async (req, res) => {
  try {
    const tx = await Transaction.create({
      userId: "demo-user",
      date: "2026-06-09",
      type: "expense",
      category: "Food",
      amount: 100,
      mode: "UPI",
      description: "Pizza"
    });

    res.json(tx);
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
});

// ─── Budget configuration ────────────────────────────────────────────────────
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
    
    // Save to MongoDB
    const tx = new Transaction({
      userId: "demo-user",
      date: now.toISOString().split("T")[0],
      type: parsed.amount < 0 ? "expense" : "income",
      category: parsed.category,
      source: parsed.desc,
      amount: Math.abs(parsed.amount),
      mode: parsed.paymentMode || "Cash",
      description: parsed.desc
    });
    await tx.save();

    // Map back for the frontend
    const newTxFormatted = {
      id: tx._id,
      desc: tx.description,
      category: tx.category,
      subCategory: parsed.subCategory,
      amount: parsed.amount,
      date: tx.date,
      time: now.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      icon: parsed.icon,
      paymentMode: tx.mode
    };

    // Calculate dynamic budget warning from MongoDB
    const userTransactions = await Transaction.find({ userId: "demo-user" });
    
    const catSpend = userTransactions
      .filter((t) => t.category === parsed.category && t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0);

    const limit = budgetLimits[parsed.category];
    const budgetWarning =
      limit && catSpend > limit * 0.8
        ? `⚠️ ${parsed.category} budget is now at ${Math.round((catSpend / limit) * 100)}% — ₹${(limit - catSpend).toLocaleString("en-IN")} remaining.`
        : null;

    res.json({ transaction: newTxFormatted, budgetWarning });
  } catch (err) {
    console.error("Log expense error:", err.message);
    res.status(500).json({ error: "Failed to log expense." });
  }
});

// ─── GET ALL TRANSACTIONS ─────────────────────────────────────────────────────
app.get("/api/transactions", async (req, res) => {
  try {
    const dbTxs = await Transaction.find({ userId: "demo-user" }).sort({ createdAt: -1 });
    const formatted = dbTxs.map(tx => {
      const isExpense = tx.type === 'expense';
      return {
        id: tx._id,
        desc: tx.description || tx.source || '',
        category: tx.category,
        subCategory: null,
        amount: isExpense ? -tx.amount : tx.amount,
        date: tx.date,
        time: new Date(tx.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
        icon: tx.type === 'income' ? '💼' : (tx.category === 'Transport' ? '⛽' : (tx.category === 'Dining' ? '🍔' : '🛒')),
        paymentMode: tx.mode
      };
    });
    res.json({ transactions: formatted, total: formatted.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─── MONTHLY SUMMARY ──────────────────────────────────────────────────────────
app.get("/api/summary", async (req, res) => {
  try {
    const dbTxs = await Transaction.find({ userId: "demo-user" });
    const formatted = dbTxs.map(tx => ({
      amount: tx.type === 'expense' ? -tx.amount : tx.amount,
      category: tx.category
    }));

    const income = formatted
      .filter((t) => t.amount > 0)
      .reduce((s, t) => s + t.amount, 0);
    const expenses = formatted
      .filter((t) => t.amount < 0)
      .reduce((s, t) => s + Math.abs(t.amount), 0);
    const savings = income - expenses;
    const savingsRate = income > 0 ? Math.round((savings / income) * 100) : 0;

    const byCategory = {};
    formatted
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
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─── HEALTH CHECK ─────────────────────────────────────────────────────────────
app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "UP", message: "VittaMitra server active" });
});

await connectDB();

const startServer = () => {
  const server = app.listen(PORT, () => {
    console.log(`\n🚀 VittaMitra backend running at http://localhost:${PORT}`);
    console.log(`   POST /api/chat          → Vita AI chat`);
    console.log(`   POST /api/log-expense   → Parse & log expense`);
    console.log(`   GET  /api/transactions  → All transactions`);
    console.log(`   GET  /api/summary       → Monthly summary\n`);
  });

  server.on("error", (err) => {
    if (err.code === "EADDRINUSE") {
      console.log(`Port ${PORT} is currently in use. Attempting to clear the port automatically...`);
      
      const killCmd = process.platform === "win32"
        ? `npx kill-port ${PORT}` // cross-platform utility works great on Windows Command prompt/Powershell
        : `npx kill-port ${PORT}`;

      exec(killCmd, (error) => {
        if (error) {
          console.error(`Failed to automatically free port ${PORT}:`, error.message);
          console.log("Please close the conflicting process manually or choose another port.");
          process.exit(1);
        }
        console.log(`Port ${PORT} cleared. Restarting the backend server...`);
        setTimeout(startServer, 1000);
      });
    }
  });
};

startServer();
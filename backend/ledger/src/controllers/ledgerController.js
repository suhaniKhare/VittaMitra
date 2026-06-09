import fs from 'fs';
import { translateVoiceToLedger } from '../services/geminiService.js';
import { detectAnomaly, updateCategoryAverage, calculateHealthScore } from '../services/financeService.js';
import Transaction from '../models/Transaction.js';
import DailySummary from '../models/DailySummary.js';
import User from '../models/User.js';

export const processVoiceTransaction = async (req, res) => {
  const file = req.file;
  const userId = req.body.userId || '123'; // Default user for hackathon testing
  const date = req.body.date || new Date().toISOString().split('T')[0];

  if (!file) {
    return res.status(400).json({ error: 'No audio file uploaded.' });
  }

  try {
    // 1. Process Voice via Gemini Service
    const extraction = await translateVoiceToLedger(file.path, file.mimetype);

    const savedTransactions = [];
    let anomalyAlert = null;

    // 2. Persist individual transactions and compute anomalies
    for (const txData of extraction.transactions) {
      // If it's an expense, run anomaly detection & update the user's averages
      if (txData.type === 'expense') {
        const anomaly = await detectAnomaly(userId, txData.category, txData.amount);
        if (anomaly) {
          anomalyAlert = anomaly;
        }
        await updateCategoryAverage(userId, txData.category, txData.amount);
      }

      // Save Transaction
      const transaction = new Transaction({
        userId,
        date,
        type: txData.type,
        category: txData.category,
        source: txData.source || 'Self',
        amount: txData.amount,
        mode: txData.mode || 'Cash',
        description: txData.description
      });
      await transaction.save();
      savedTransactions.push(transaction);
    }

    // 3. Retrieve all transactions of the day to calculate Daily Summary
    const dayTransactions = await Transaction.find({ userId, date });
    
    let totalIncome = 0;
    let totalExpense = 0;
    let topExpenseCategory = '';
    const expenseTotals = {};

    dayTransactions.forEach(tx => {
      if (tx.type === 'income') {
        totalIncome += tx.amount;
      } else {
        totalExpense += tx.amount;
        expenseTotals[tx.category] = (expenseTotals[tx.category] || 0) + tx.amount;
      }
    });

    // Find top expense category
    let maxExpense = 0;
    for (const [cat, amt] of Object.entries(expenseTotals)) {
      if (amt > maxExpense) {
        maxExpense = amt;
        topExpenseCategory = cat;
      }
    }

    const netSavings = totalIncome - totalExpense;
    const healthScore = calculateHealthScore(totalIncome, totalExpense);

    // 4. Update Daily Summary in DB
    const dailySummary = await DailySummary.findOneAndUpdate(
      { userId, date },
      {
        userId,
        date,
        totalIncome,
        totalExpense,
        netSavings,
        topExpenseCategory,
        financialHealthScore: healthScore
      },
      { upsert: true, new: true }
    );

    // 5. Fetch user profile for monthly comparison (budget impact)
    const user = await User.findOne({ userId });
    const monthlyBudget = user?.monthlyBudget || 15000;

    // Calculate budget impact percentage for top expense
    let budgetImpactText = '';
    if (totalIncome > 0 && maxExpense > 0) {
      const percentOfIncome = Math.round((maxExpense / totalIncome) * 100);
      budgetImpactText = `${topExpenseCategory} spending has consumed ${percentOfIncome}% of today's earnings.`;
    } else if (maxExpense > 0) {
      const percentOfBudget = Math.round((maxExpense / monthlyBudget) * 100);
      budgetImpactText = `${topExpenseCategory} spending consumes ${percentOfBudget}% of your monthly baseline budget.`;
    }

    // 6. Structure Final Payload Response
    const responsePayload = {
      // 1. Transaction Summary
      ledgerEntries: extraction.transactions.map(tx => ({
        type: tx.type,
        category: tx.category,
        amount: tx.amount,
        mode: tx.mode,
        description: tx.description
      })),

      // 2. Cash Flow Update
      cashFlow: {
        incomeAdded: extraction.transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0),
        expenseAdded: extraction.transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0),
        netEarnings: netSavings
      },

      // 3. Confirmation Message
      confirmationMessage: extraction.voiceReply,

      // 4. Budget Impact Analysis
      budgetImpact: {
        text: budgetImpactText || 'No major expenses recorded today.',
        availableBalance: netSavings
      },

      // 5. AI Suggestions
      aiSuggestions: extraction.suggestions,

      // 6. Database Record representation
      databaseRecord: {
        userId,
        date,
        transactions: savedTransactions,
        netIncome: netSavings
      },

      // Advanced Outputs (Hackathon Features)
      advancedOutputs: {
        dailyFinancialSnapshot: {
          income: totalIncome,
          expenses: totalExpense,
          netSavings,
          topExpense: maxExpense > 0 ? `${topExpenseCategory} (₹${maxExpense})` : 'None',
          financialHealthScore: healthScore
        },
        anomalyAlert: anomalyAlert ? {
          type: 'WARNING',
          message: `Your ${anomalyAlert.category} expense today (₹${anomalyAlert.currentAmount}) is ${anomalyAlert.increasePercent}% higher than your average ${anomalyAlert.category} expense (₹${anomalyAlert.historicalAverage}).`,
          reviewRequired: true
        } : null
      }
    };

    // Clean up uploaded audio file
    fs.unlink(file.path, (err) => {
      if (err) console.error('Failed to delete temp file:', file.path, err);
    });

    return res.status(200).json(responsePayload);

  } catch (error) {
    console.error('Error processing transaction audio:', error);
    
    // Clean up file if still exists
    if (file && fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }
    
    return res.status(500).json({
      error: 'Failed to process voice transaction',
      details: error.message
    });
  }
};

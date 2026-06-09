import mongoose from 'mongoose';

const DailySummarySchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  date: {
    type: String, // Format: YYYY-MM-DD
    required: true,
    index: true
  },
  totalIncome: {
    type: Number,
    default: 0
  },
  totalExpense: {
    type: Number,
    default: 0
  },
  netSavings: {
    type: Number,
    default: 0
  },
  topExpenseCategory: {
    type: String
  },
  financialHealthScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 100
  }
}, {
  timestamps: true
});

// Ensure a single summary per user per day
DailySummarySchema.index({ userId: 1, date: 1 }, { unique: true });

const DailySummary = mongoose.model('DailySummary', DailySummarySchema);
export default DailySummary;

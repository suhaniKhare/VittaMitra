import mongoose from 'mongoose';

const TransactionSchema = new mongoose.Schema({
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
  type: {
    type: String,
    enum: ['income', 'expense'],
    required: true
  },
  category: {
    type: String,
    required: true
  },
  source: {
    type: String
  },
  amount: {
    type: Number,
    required: true
  },
  mode: {
    type: String,
    default: 'Cash'
  },
  description: {
    type: String
  }
}, {
  timestamps: true
});

// Composite index to speed up daily transactions query
TransactionSchema.index({ userId: 1, date: 1 });

const Transaction = mongoose.model('Transaction', TransactionSchema);
export default Transaction;

import User from '../models/User.js';
import Transaction from '../models/Transaction.js';

/**
 * Calculates a standard financial health score (0-100) based on income vs expenses
 * @param {number} totalIncome
 * @param {number} totalExpense
 * @returns {number} Health score out of 100
 */
export const calculateHealthScore = (totalIncome, totalExpense) => {
  if (totalIncome === 0) {
    return totalExpense > 0 ? Math.max(10, 50 - Math.round(totalExpense / 100)) : 100;
  }
  
  const savingsRate = ((totalIncome - totalExpense) / totalIncome) * 100;
  
  // Scale savings rate to health score:
  // savingsRate >= 40% is excellent (score 90-100)
  // savingsRate between 0% and 40% is fair (score 50-89)
  // savingsRate < 0% (deficit) is critical (score < 50)
  if (savingsRate >= 40) {
    return Math.min(100, 90 + Math.round((savingsRate - 40) * 0.16));
  } else if (savingsRate >= 0) {
    return 50 + Math.round(savingsRate * 1.0); // 50 to 90
  } else {
    return Math.max(10, 50 + Math.round(savingsRate * 0.5)); // Drops below 50
  }
};

/**
 * Checks for transaction spending anomalies compared to historical user averages
 * @param {string} userId
 * @param {string} category
 * @param {number} amount
 * @returns {Promise<object|null>} Alert details if anomalous, otherwise null
 */
export const detectAnomaly = async (userId, category, amount) => {
  const user = await User.findOne({ userId });
  if (!user) return null;

  const average = user.categoryAverages.get(category);
  if (average && average > 0) {
    const increasePercent = ((amount - average) / average) * 100;
    if (increasePercent >= 40) {
      return {
        category,
        currentAmount: amount,
        historicalAverage: Math.round(average),
        increasePercent: Math.round(increasePercent)
      };
    }
  }
  return null;
};

/**
 * Updates a user's running category average with a new expense transaction
 * @param {string} userId
 * @param {string} category
 * @param {number} amount
 */
export const updateCategoryAverage = async (userId, category, amount) => {
  let user = await User.findOne({ userId });
  if (!user) {
    // Auto-create user profile if it doesn't exist
    user = new User({
      userId,
      name: 'Default User',
      categoryAverages: {}
    });
  }

  const currentAverage = user.categoryAverages.get(category) || 0;
  
  // Apply a simple Exponential Moving Average (EMA) to update average category spending
  let newAverage;
  if (currentAverage === 0) {
    newAverage = amount;
  } else {
    newAverage = (currentAverage * 0.7) + (amount * 0.3);
  }

  user.categoryAverages.set(category, newAverage);
  await user.save();
};

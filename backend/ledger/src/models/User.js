import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  name: {
    type: String,
    required: true
  },
  monthlyBudget: {
    type: Number,
    default: 0
  },
  categoryAverages: {
    type: Map,
    of: Number,
    default: {}
  }
}, {
  timestamps: true
});

const User = mongoose.model('User', UserSchema);
export default User;

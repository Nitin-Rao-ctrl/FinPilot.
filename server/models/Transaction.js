const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },

    type: {
      type: String,
      enum: ['income', 'expense'],
      required: true,
    },

    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    category: {
      type: String,
      required: true,
    },

    // Fixed vs Variable expense
    // Fixed: Rent, EMI, Mess, Loan, etc.
    // Variable: Food, Shopping, Movies, Travel, etc.
    expenseType: {
      type: String,
      enum: ['fixed', 'variable'],
      default: 'variable',
    },

    // Backward-compatible fixed expense flag
    // true = fixed commitment
    // false = variable/discretionary expense
    isFixed: {
      type: Boolean,
      default: false,
    },

    description: {
      type: String,
      default: '',
    },

    merchant: {
      type: String,
      default: '',
    },

    date: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  'Transaction',
  transactionSchema
);
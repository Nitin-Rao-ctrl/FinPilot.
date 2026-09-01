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

    // Only relevant for expenses.
    // Existing transactions without this field will remain valid.
    expenseType: {
      type: String,
      enum: ['fixed', 'variable'],
      default: 'variable',
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

module.exports = mongoose.model('Transaction', transactionSchema);
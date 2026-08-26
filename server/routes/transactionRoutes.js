const express = require('express');
const Transaction = require('../models/Transaction');

const router = express.Router();

/*
  GET all transactions for one user

  Example:
  GET /api/transactions?userId=abc123
*/
router.get('/', async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({
        message: 'userId is required',
      });
    }

    const transactions = await Transaction.find({
      userId,
    }).sort({ date: -1 });

    res.json(transactions);
  } catch (error) {
    console.error('GET transactions error:', error);

    res.status(500).json({
      message: error.message,
    });
  }
});


/*
  CREATE transaction
*/
router.post('/', async (req, res) => {
  try {
    const {
      userId,
      type,
      amount,
      category,
      description,
      merchant,
      date,
    } = req.body;

    if (!userId) {
      return res.status(400).json({
        message: 'userId is required',
      });
    }

    const transaction = await Transaction.create({
      userId,
      type,
      amount,
      category,
      description,
      merchant,
      date,
    });

    res.status(201).json(transaction);
  } catch (error) {
    console.error('POST transaction error:', error);

    res.status(400).json({
      message: error.message,
    });
  }
});


/*
  UPDATE transaction

  Only the owner can update it.
*/
router.put('/:id', async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        message: 'userId is required',
      });
    }

    const transaction = await Transaction.findOneAndUpdate(
      {
        _id: req.params.id,
        userId,
      },
      {
        $set: {
          type: req.body.type,
          amount: req.body.amount,
          category: req.body.category,
          description: req.body.description,
          merchant: req.body.merchant,
          date: req.body.date,
        },
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!transaction) {
      return res.status(404).json({
        message: 'Transaction not found',
      });
    }

    res.json(transaction);
  } catch (error) {
    console.error('UPDATE transaction error:', error);

    res.status(400).json({
      message: error.message,
    });
  }
});


/*
  DELETE transaction

  Only the owner can delete it.
*/
router.delete('/:id', async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({
        message: 'userId is required',
      });
    }

    const transaction = await Transaction.findOneAndDelete({
      _id: req.params.id,
      userId,
    });

    if (!transaction) {
      return res.status(404).json({
        message: 'Transaction not found',
      });
    }

    res.json({
      message: 'Transaction deleted successfully',
    });
  } catch (error) {
    console.error('DELETE transaction error:', error);

    res.status(400).json({
      message: error.message,
    });
  }
});


module.exports = router;
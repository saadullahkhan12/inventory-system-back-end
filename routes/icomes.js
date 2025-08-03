const express = require('express');
const router = express.Router();
const Icome = require('../models/Icomes');

// Create new income record
router.post('/', async (req, res) => {
  try {
    const { totalIncome, productsSold, date } = req.body;
    const newEntry = new Icome({
      totalIncome,
      productsSold,
      date: date || new Date()
    });
    await newEntry.save();
    res.status(201).json(newEntry);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create income record', details: err.message });
  }
});

// Get all income records
router.get('/', async (req, res) => {
  try {
    const records = await Icome.find().sort({ date: -1 });
    res.json(records);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch income records' });
  }
});

// Get today's income
router.get('/today', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const records = await Icome.find({
      date: { $gte: today, $lt: tomorrow }
    });

    res.json(records);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch today\'s income' });
  }
});

// Get income of last 7 days
router.get('/weekly', async (req, res) => {
  try {
    const from = new Date();
    from.setDate(from.getDate() - 6); // past 7 days including today
    from.setHours(0, 0, 0, 0);

    const records = await Icome.find({
      date: { $gte: from }
    });

    res.json(records);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch weekly income' });
  }
});

// Get income of current month
router.get('/monthly', async (req, res) => {
  try {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const records = await Icome.find({
      date: { $gte: start, $lt: end }
    });

    res.json(records);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch monthly income' });
  }
});

// Delete income record
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await Icome.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Record not found' });
    res.json({ message: 'Record deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete income record' });
  }
});

module.exports = router;

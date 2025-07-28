const express = require('express');
const router = express.Router();

const Slip = require('../models/slip');  


router.post('/', async (req, res) => {
  try {
    const { customerName, paymentType, items } = req.body;

    // Calculate total quantity and total amount
    const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
    const totalAmount = items.reduce((sum, item) => sum + item.total, 0);

    // Create new slip
    const newSlip = new Slip({
      customerName,
      paymentType,
      items,
      totalQuantity,
      totalAmount
    });

    await newSlip.save();

    res.status(201).json(newSlip);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
});


router.get('/', async (req, res) => {
  try {
    const slips = await Slip.find().sort({ date: -1 });
    res.json(slips);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;

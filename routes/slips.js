const express = require('express');
const router = express.Router();

const Slip = require('../models/slips');
const Item = require('../models/items'); // ✅ Import Item model

// Create new slip
router.post('/', async (req, res) => {
  try {
    const { customerName, paymentType, items } = req.body;

    // Get prices from inventory automatically
    const populatedItems = await Promise.all(
      items.map(async (slipItem) => {
        const itemFromDB = await Item.findById(slipItem._id);
        if (!itemFromDB) throw new Error(`Item not found: ${slipItem._id}`);

        return {
          itemName: itemFromDB.name, // ✅ match your slip schema
          quantity: slipItem.quantity,
          price: itemFromDB.price,
          total: itemFromDB.price * slipItem.quantity
        };
      })
    );

    // Calculate totals
    const totalQuantity = populatedItems.reduce((sum, i) => sum + i.quantity, 0);
    const totalAmount = populatedItems.reduce((sum, i) => sum + i.total, 0);

    // Create slip
    const newSlip = new Slip({
      customerName,
      paymentType,
      items: populatedItems,
      totalQuantity,
      totalAmount
    });

    await newSlip.save();

    // ✅ Update inventory stock
    for (let slipItem of items) {
      await Item.findByIdAndUpdate(slipItem._id, {
        $inc: { quantity: -slipItem.quantity }
      });
    }

    res.status(201).json(newSlip);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

// Get all slips
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

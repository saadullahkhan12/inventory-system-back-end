const express = require('express');
const router = express.Router();

const Slip = require('../models/slips');  


// POST /api/slips
router.post('/', async (req, res) => {
  try {
    const { customerName, paymentType, items } = req.body;

    const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
    const totalAmount = items.reduce((sum, item) => sum + item.total, 0);

    // 1. Save Slip
    const newSlip = new Slip({
      customerName,
      paymentType,
      items,
      totalQuantity,
      totalAmount
    });
    await newSlip.save();

    // 2. Update Inventory
    for (let sold of items) {
      await Item.findOneAndUpdate(
        { name: sold.itemName },
        { $inc: { quantity: -sold.quantity } }
      );
    }

    // 3. Add to Income
    const incomeEntry = new Icome({
      totalIncome: totalAmount,
      productsSold: items.map(i => ({
        productName: i.itemName,
        quantity: i.quantity,
        unitPrice: i.price,
        totalPrice: i.total
      }))
    });
    await incomeEntry.save();

    res.status(201).json({ slip: newSlip, income: incomeEntry });

  } catch (error) {
    console.error(error);
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
// DELETE /api/slips/:id
router.delete('/:id', async (req, res) => {
  try {
    const slip = await Slip.findById(req.params.id);
    if (!slip) return res.status(404).json({ error: "Slip not found" });

    // 1. Return products to inventory
    for (let sold of slip.items) {
      await Item.findOneAndUpdate(
        { name: sold.itemName },
        { $inc: { quantity: sold.quantity } }
      );
    }

    // 2. Remove income entry for this slip
    await Icome.deleteOne({ totalIncome: slip.totalAmount, date: slip.date });

    // 3. Delete slip
    await Slip.findByIdAndDelete(req.params.id);

    res.json({ message: "Slip canceled and inventory restored" });

  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});


module.exports = router;

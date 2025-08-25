// routes/items.js
const express = require('express');
const router = express.Router();
const Item = require('../models/items');

// Get all items
router.get('/', async (req, res) => {
  try {
    const items = await Item.find();
    res.json(items);
  } catch (error) {
    res.status(500).send('Server Error');
  }
});


// Add item
// Add item (with stock update if exists) 
router.post('/', async (req, res) => {
  try {
    const { name, sku, category, quantity, price } = req.body;

    // Check if item already exists by name or SKU
    let existingItem = await Item.findOne({ name });

    if (existingItem) {
      // Update quantity if already exists
      existingItem.quantity += quantity;
      existingItem.price = price; // Optional: update price if needed
      await existingItem.save();
      return res.json(existingItem);
    }

    // If new item
    const newItem = new Item({ name, sku, category, quantity, price });
    await newItem.save();
    res.json(newItem);

  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
});


// Edit item
router.put('/:id', async (req, res) => {
  const updatedItem = await Item.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(updatedItem);
});

// Delete item
router.delete('/:id', async (req, res) => {
  await Item.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

module.exports = router;

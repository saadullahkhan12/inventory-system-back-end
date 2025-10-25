const express = require('express');
const router = express.Router();
const Slip = require('../models/slips');
const Item = require('../models/items');
const Income = require('../models/income');

// GET /api/slips - Get all slips with pagination and filtering
router.get('/', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      startDate, 
      endDate, 
      status = '',
      paymentMethod = ''
    } = req.query;

    const filter = {};
    
    // Date filter
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    // Status filter
    if (status) {
      filter.status = status;
    }

    // Payment method filter
    if (paymentMethod) {
      filter.paymentMethod = paymentMethod;
    }

    const slips = await Slip.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Slip.countDocuments(filter);

    res.json({
      slips,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      totalSlips: total
    });
  } catch (err) {
    console.error('❌ Error fetching slips:', err);
    res.status(500).json({ 
      error: 'Failed to fetch slips', 
      details: err.message 
    });
  }
});

// GET /api/slips/:id - Get slip by ID
router.get('/:id', async (req, res) => {
  try {
    const slip = await Slip.findById(req.params.id);
    
    if (!slip) {
      return res.status(404).json({ error: 'Slip not found' });
    }

    res.json(slip);
  } catch (err) {
    console.error('❌ Error fetching slip:', err);
    
    if (err.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid slip ID format' });
    }
    
    res.status(500).json({ 
      error: 'Failed to fetch slip', 
      details: err.message 
    });
  }
});

// POST /api/slips - Create slip and update inventory
router.post('/', async (req, res) => {
  const session = await Slip.startSession();
  session.startTransaction();

  try {
    console.log('📩 Creating new slip...');

    const {
      customerName,
      customerPhone,
      customerEmail,
      subtotal,
      tax,
      discount,
      totalAmount,
      paymentMethod,
      notes,
      products
    } = req.body;

    // Validate required fields
    if (!products || !Array.isArray(products) || products.length === 0) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ 
        error: 'Products array is required and cannot be empty' 
      });
    }

    if (subtotal === undefined || totalAmount === undefined) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ 
        error: 'Subtotal and total amount are required' 
      });
    }

    // Validate products and check stock
    const productUpdates = [];
    
    for (const product of products) {
      const productName = product.productName || product.itemName;
      const quantity = product.quantity;
      const unitPrice = product.unitPrice ?? product.price;

      if (!productName || quantity == null || unitPrice == null) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({ 
          error: 'Each product must include name, quantity, and unit price' 
        });
      }

      if (quantity <= 0) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({ 
          error: 'Product quantity must be greater than 0' 
        });
      }

      // Find item in inventory to check stock
      const inventoryItem = await Item.findOne({
        $or: [
          { name: { $regex: new RegExp(productName, 'i') } },
          { sku: { $regex: new RegExp(productName, 'i') } }
        ],
        isActive: true
      }).session(session);

      if (!inventoryItem) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({ 
          error: `Product "${productName}" not found in inventory` 
        });
      }

      if (inventoryItem.quantity < quantity) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({ 
          error: `Insufficient stock for "${productName}". Available: ${inventoryItem.quantity}, Requested: ${quantity}` 
        });
      }

      // Prepare inventory update
      productUpdates.push({
        itemId: inventoryItem._id,
        quantity: quantity,
        currentStock: inventoryItem.quantity
      });
    }

    // Create slip
    const newSlip = new Slip({
      customerName: customerName || 'Walk-in Customer',
      customerPhone: customerPhone || '',
      customerEmail: customerEmail || '',
      products: products.map(p => ({
        productName: p.productName || p.itemName,
        quantity: p.quantity,
        unitPrice: p.unitPrice ?? p.price,
        totalPrice: (p.quantity * (p.unitPrice ?? p.price))
      })),
      subtotal: subtotal || 0,
      tax: tax || 0,
      discount: discount || 0,
      totalAmount: totalAmount || 0,
      paymentMethod: paymentMethod || 'Cash',
      notes: notes || '',
      status: 'Paid'
    });

    // Update inventory quantities
    for (const update of productUpdates) {
      await Item.findByIdAndUpdate(
        update.itemId,
        { 
          $inc: { quantity: -update.quantity },
          lastUpdated: new Date()
        },
        { session }
      );
    }

    // Create income record
    const incomeRecord = new Income({
      date: new Date(),
      totalIncome: totalAmount,
      productsSold: products.map(p => ({
        productName: p.productName || p.itemName,
        quantity: p.quantity,
        unitPrice: p.unitPrice ?? p.price,
        totalPrice: (p.quantity * (p.unitPrice ?? p.price)),
        category: 'Sale'
      })),
      customerName: customerName || 'Walk-in Customer',
      paymentMethod: paymentMethod || 'Cash',
      slipNumber: newSlip.slipNumber,
      notes: `Sale from slip ${newSlip.slipNumber}`
    });

    // Save all documents
    await newSlip.save({ session });
    await incomeRecord.save({ session });
    
    // Commit transaction
    await session.commitTransaction();
    session.endSession();

    console.log('✅ Slip created successfully:', newSlip._id);

    res.status(201).json({
      message: 'Slip created successfully and inventory updated',
      slip: newSlip,
      incomeRecord: incomeRecord
    });

  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    
    console.error('❌ Error creating slip:', err);
    
    if (err.code === 11000) {
      return res.status(400).json({ error: 'Slip number already exists' });
    }
    
    res.status(500).json({
      error: 'Failed to create slip',
      details: err.message
    });
  }
});

// PUT /api/slips/:id - Update slip
router.put('/:id', async (req, res) => {
  try {
    const {
      customerName,
      customerPhone,
      customerEmail,
      subtotal,
      tax,
      discount,
      totalAmount,
      paymentMethod,
      notes,
      status
    } = req.body;

    const updatedSlip = await Slip.findByIdAndUpdate(
      req.params.id,
      {
        customerName,
        customerPhone,
        customerEmail,
        subtotal,
        tax,
        discount,
        totalAmount,
        paymentMethod,
        notes,
        status
      },
      { new: true, runValidators: true }
    );

    if (!updatedSlip) {
      return res.status(404).json({ error: 'Slip not found' });
    }

    res.json({
      message: 'Slip updated successfully',
      slip: updatedSlip
    });
  } catch (err) {
    console.error('❌ Error updating slip:', err);
    res.status(500).json({
      error: 'Failed to update slip',
      details: err.message
    });
  }
});

// DELETE /api/slips/:id - Delete slip
router.delete('/:id', async (req, res) => {
  try {
    const deletedSlip = await Slip.findByIdAndDelete(req.params.id);
    
    if (!deletedSlip) {
      return res.status(404).json({ error: 'Slip not found' });
    }

    res.json({ 
      message: 'Slip deleted successfully' 
    });
  } catch (err) {
    console.error('❌ Error deleting slip:', err);
    res.status(500).json({
      error: 'Failed to delete slip',
      details: err.message
    });
  }
});

module.exports = router;
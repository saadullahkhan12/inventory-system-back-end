const express = require('express');
const router = express.Router();
const Item = require('../models/items');
const Slip = require('../models/slips');
const Income = require('../models/income');

// GET /api/analytics/dashboard - Get comprehensive dashboard analytics
router.get('/dashboard', async (req, res) => {
  try {
    console.log('📊 Fetching dashboard analytics...');
    
    // Basic counts
    const totalItems = await Item.countDocuments({ isActive: true });
    const totalSlips = await Slip.countDocuments();
    const totalIncomeRecords = await Income.countDocuments({ isActive: true });
    
    // Revenue calculations
    const totalRevenueResult = await Slip.aggregate([
      { $match: { status: { $ne: 'Cancelled' } } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);

    const totalRevenue = totalRevenueResult[0]?.total || 0;

    // Today's date calculations
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    // Today's slips and revenue
    const todaySlips = await Slip.countDocuments({
      createdAt: { $gte: today, $lt: tomorrow }
    });

    const todayRevenueResult = await Slip.aggregate([
      { 
        $match: { 
          createdAt: { $gte: today, $lt: tomorrow },
          status: { $ne: 'Cancelled' }
        } 
      },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);

    const todayRevenue = todayRevenueResult[0]?.total || 0;

    // Low stock items
    const lowStockItems = await Item.countDocuments({ 
      quantity: { $lte: 10 },
      isActive: true 
    });

    // Recent sales activity
    const recentSales = await Slip.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('slipNumber totalAmount customerName createdAt');

    // Payment method distribution
    const paymentMethods = await Slip.aggregate([
      { $match: { status: { $ne: 'Cancelled' } } },
      {
        $group: {
          _id: '$paymentMethod',
          count: { $sum: 1 },
          total: { $sum: '$totalAmount' }
        }
      }
    ]);

    res.json({
      summary: {
        totalItems,
        totalSlips,
        totalIncomeRecords,
        totalRevenue,
        todaySlips,
        todayRevenue,
        lowStockItems
      },
      recentSales,
      paymentMethods,
      message: 'Dashboard analytics fetched successfully'
    });
  } catch (error) {
    console.error('❌ Error fetching analytics:', error);
    res.status(500).json({ 
      error: 'Failed to fetch analytics', 
      details: error.message 
    });
  }
});

// GET /api/analytics/sales-trends - Get sales trends for charts
router.get('/sales-trends', async (req, res) => {
  try {
    const { period = 'week' } = req.query; // week, month, year
    
    let days = 7;
    let groupFormat = '%Y-%m-%d';
    
    switch (period) {
      case 'month':
        days = 30;
        break;
      case 'year':
        days = 365;
        groupFormat = '%Y-%m';
        break;
      default:
        days = 7;
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const salesTrends = await Slip.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          status: { $ne: 'Cancelled' }
        }
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: groupFormat, date: '$createdAt' } }
          },
          totalSales: { $sum: '$totalAmount' },
          totalTransactions: { $sum: 1 },
          averageSale: { $avg: '$totalAmount' }
        }
      },
      { $sort: { '_id.date': 1 } }
    ]);

    res.json({
      period,
      salesTrends,
      message: 'Sales trends fetched successfully'
    });
  } catch (error) {
    console.error('❌ Error fetching sales trends:', error);
    res.status(500).json({ 
      error: 'Failed to fetch sales trends', 
      details: error.message 
    });
  }
});

module.exports = router;
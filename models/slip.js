const mongoose = require('mongoose');

const slipSchema = new mongoose.Schema({
  slipNumber: {
    type: String,
    unique: true,
    default: () => 'SLIP-' + Date.now()
  },
  customerName: String,
  date: {
    type: Date,
    default: Date.now
  },
  time: {
    type: String,
    default: () => new Date().toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  },
  paymentType: String,
  items: [
    {
      itemName: String,
      quantity: Number,
      price: Number,
      total: Number
    }
  ],
  totalQuantity: Number,
  totalAmount: Number
});

module.exports = mongoose.model('Slip', slipSchema);

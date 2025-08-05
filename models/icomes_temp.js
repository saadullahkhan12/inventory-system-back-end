const mongoose = require('mongoose');

const SoldProductSchema = new mongoose.Schema({
  productName: { type: String, required: true },
  sku: { type: String },
  quantity: { type: Number, required: true },
  unitPrice: { type: Number, required: true },
  totalPrice: { type: Number, required: true }, // quantity * unitPrice
}, { _id: false });

const IcomeSchema = new mongoose.Schema({
  date: { type: Date, default: Date.now },
  totalIncome: { type: Number, required: true },
  productsSold: [SoldProductSchema]
}, { timestamps: true });

module.exports = mongoose.model('Icomes', IcomeSchema);

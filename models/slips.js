const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  productName: { type: String, required: true, trim: true },
  quantity: { type: Number, required: true, min: 1 },
  unitPrice: { type: Number, required: true, min: 0 },
  totalPrice: { type: Number, required: true, min: 0 },
  category: { type: String, trim: true, default: "" },
  subcategory: { type: String, trim: true, default: "" },
  company: { type: String, trim: true, default: "" }
}, { _id: false });

const SlipSchema = new mongoose.Schema({
  slipNumber: { type: String, unique: true, trim: true },

  date: { type: Date, default: Date.now },

  customerName: { 
    type: String, 
    default: 'Walk-in Customer', 
    trim: true 
  },

  customerPhone: {
    type: String,
    trim: true,
    default: ''
  },

  paymentMethod: {
    type: String,
    enum: ['Cash', 'Card', 'UPI', 'Bank Transfer', 'Credit', 'Other'],
    default: 'Cash'
  },

  notes: {
    type: String,
    trim: true,
    default: ''
  },

  tax: {
    type: Number,
    default: 0,
    min: 0
  },

  discount: {
    type: Number,
    default: 0,
    min: 0
  },

  products: [ProductSchema],

  subtotal: { type: Number, required: true, min: 0 },

  totalAmount: { type: Number, required: true, min: 0 },

  status: {
    type: String,
    enum: ['Pending', 'Paid', 'Cancelled'],
    default: 'Paid'
  },

  cancelledAt: {
    type: Date,
    default: null
  }

}, { timestamps: true });

// indexes
SlipSchema.index({ date: -1 });
SlipSchema.index({ customerName: 1 });

// Auto slip number
SlipSchema.pre('save', function (next) {
  if (!this.slipNumber) {
    this.slipNumber = `SLP-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
  }
  next();
});

module.exports = mongoose.models.Slip || mongoose.model("Slip", SlipSchema);

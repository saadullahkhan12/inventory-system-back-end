const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  productName: { 
    type: String, 
    required: true,
    trim: true
  },
  quantity: { 
    type: Number, 
    required: true,
    min: 1
  },
  unitPrice: { 
    type: Number, 
    required: true,
    min: 0
  },
  totalPrice: { 
    type: Number, 
    required: true,
    min: 0
  }
}, { _id: false });

const SlipSchema = new mongoose.Schema({
  slipNumber: { 
    type: String, 
    unique: true, // this already creates an index automatically
    trim: true
  },
  date: { 
    type: Date, 
    default: Date.now
  },
  customerName: {
    type: String,
    default: '',
    trim: true
  },
  customerPhone: {
    type: String,
    default: '',
    trim: true
  },
  customerEmail: {
    type: String,
    default: '',
    trim: true
  },
  products: [ProductSchema],
  subtotal: { 
    type: Number, 
    required: true,
    min: 0
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
  totalAmount: { 
    type: Number, 
    required: true,
    min: 0
  },
  paymentMethod: {
    type: String,
    enum: ['Cash', 'Card', 'UPI', 'Bank Transfer', 'Credit', 'Other'],
    default: 'Cash'
  },
  notes: {
    type: String,
    default: '',
    trim: true
  },
  status: {
    type: String,
    enum: ['Pending', 'Paid', 'Cancelled'],
    default: 'Paid'
  }
}, { 
  timestamps: true 
});

// ✅ Keep only these indexes
SlipSchema.index({ date: -1 });
SlipSchema.index({ customerName: 1 });

// Pre-save: Auto-generate slip number and validate total
SlipSchema.pre('save', function(next) {
  if (!this.slipNumber) {
    this.slipNumber = `SLP-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
  }

  const calculatedTotal = this.subtotal + this.tax - this.discount;
  if (Math.abs(calculatedTotal - this.totalAmount) > 0.01) {
    console.warn(`Slip total mismatch: calculated ${calculatedTotal}, stored ${this.totalAmount}`);
  }

  next();
});

module.exports = mongoose.models.Slip || mongoose.model("Slip", SlipSchema);

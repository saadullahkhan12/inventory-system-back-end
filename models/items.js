const mongoose = require('mongoose');

const ItemSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true,
    trim: true,
    index: true
  },
  sku: { 
    type: String, 
    required: true,
    unique: true,
    trim: true,
    uppercase: true,
    index: true
  },
  category: { 
    type: String, 
    default: "General",
    trim: true,
    index: true
  },
  quantity: { 
    type: Number, 
    default: 0,
    min: 0
  },
  price: { 
    type: Number, 
    default: 0,
    min: 0
  },
  description: {
    type: String,
    default: "",
    trim: true
  },
  minStockLevel: {
    type: Number,
    default: 10
  },
  maxStockLevel: {
    type: Number,
    default: 1000
  },
  supplier: {
    type: String,
    default: ""
  },
  costPrice: {
    type: Number,
    default: 0,
    min: 0
  },
  profitMargin: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
}, {
  timestamps: true
});

// Index for better search performance
ItemSchema.index({ name: 'text', sku: 'text', description: 'text' });

// Virtual for profit calculation
ItemSchema.virtual('profit').get(function() {
  return this.price - this.costPrice;
});

// Virtual for profit percentage
ItemSchema.virtual('profitPercentage').get(function() {
  if (this.costPrice === 0) return 0;
  return ((this.price - this.costPrice) / this.costPrice) * 100;
});

// Method to check if item is low stock
ItemSchema.methods.isLowStock = function() {
  return this.quantity <= this.minStockLevel;
};

// Method to check if item is out of stock
ItemSchema.methods.isOutOfStock = function() {
  return this.quantity === 0;
};

// Static method to get low stock items
ItemSchema.statics.getLowStockItems = function(threshold = 10) {
  return this.find({ quantity: { $lte: threshold } });
};

// Static method to get out of stock items
ItemSchema.statics.getOutOfStockItems = function() {
  return this.find({ quantity: 0 });
};

// Pre-save middleware to update lastUpdated
ItemSchema.pre('save', function(next) {
  this.lastUpdated = new Date();
  next();
});

module.exports = mongoose.model('Item', ItemSchema);


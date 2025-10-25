const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// ✅ CORS configuration
app.use(cors({
  origin: [
    'https://inventory-system-gamma-five.vercel.app',
    'http://localhost:5173',
    'http://localhost:3000'
  ],
  credentials: true
}));

// ✅ Parse JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// ✅ Connect MongoDB Atlas
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Atlas connected"))
  .catch((err) => console.error("❌ Connection failed:", err.message));

// ✅ Test route
app.get('/api/test', (req, res) => {
  res.json({
    message: '✅ Backend API is running!',
    timestamp: new Date(),
    endpoints: ['/api/items', '/api/income', '/api/slips', '/api/analytics']
  });
});

// ✅ Import routes
app.use('/api/items', require('./routes/items'));
app.use('/api/income', require('./routes/income'));
app.use('/api/slips', require('./routes/slips'));
app.use('/api/analytics', require('./routes/analytics'));

// ✅ 404 handler (must be last)
app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found',
    requestedUrl: req.originalUrl
  });
});

// ✅ Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

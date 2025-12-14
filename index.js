const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

/* -----------------------------------------
   ✅ CORS CONFIG (Frontend + Local + Render)
------------------------------------------- */
app.use(
  cors({
    origin: [
      'https://inventory-system-gamma-five.vercel.app', // LIVE FRONTEND
      'http://localhost:5173', // Vite Local
      'http://localhost:3000', // React Local
      'http://localhost:5000'
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
  })
);

// Parse JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* -----------------------------------------
   ✅ Connect MongoDB Atlas
------------------------------------------- */
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB Atlas connected'))
  .catch((err) => console.error('❌ MongoDB connection failed:', err.message));

/* -----------------------------------------
   ✅ Root route (IMPORTANT for Render)
------------------------------------------- */
app.get('/', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Backend is live and working!',
    time: new Date(),
    health: 'All systems functional',
  });
});

/* -----------------------------------------
   ✅ Test route
------------------------------------------- */
app.get('/api/test', (req, res) => {
  res.json({
    message: 'Backend test API is running!',
    timestamp: new Date(),
    endpoints: ['/api/items', '/api/income', '/api/slips', '/api/analytics'],
  });
});

/* -----------------------------------------
   ✅ Import routes
------------------------------------------- */
app.use('/api/items', require('./routes/items'));
app.use('/api/income', require('./routes/income'));
app.use('/api/slips', require('./routes/slips'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/history', require('./routes/history'));

/* -----------------------------------------
   ✅ 404 Handler (MUST BE LAST)
------------------------------------------- */
app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found',
    requestedUrl: req.originalUrl,
  });
});

/* -----------------------------------------
   ✅ Start Server
------------------------------------------- */
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

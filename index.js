// server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());
console.log('MONGO_URI from .env:', process.env.MONGO_URI);




mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Atlas connected"))
  .catch((err) => console.error("❌ Connection failed:", err.message));

app.use('/api/items', require('./routes/item'));
app.use('/api/slips', require('./routes/slips'));


app.listen(process.env.PORT, () => console.log(`Server running on http://localhost:${process.env.PORT}`));

// server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/inventory');

app.use('/api/items', require('./routes/item'));
app.use('/api/slips', require('./routes/slips'));


app.listen(5000, () => console.log('Server running on http://localhost:5000'));


const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const deployRoutes = require('./routes/deploy');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api', deployRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Hosting Control Panel Backend is healthy.' });
});

// Connect to MongoDB Database
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/hosting-control-panel';

console.log('Connecting to MongoDB...');
mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('MongoDB connected successfully.');
    // Start listening for client requests
    app.listen(PORT, () => {
      console.log(`Backend server is running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Database connection failed:', err.message);
    process.exit(1);
  });

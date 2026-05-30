

'use strict';

const mongoose = require('mongoose');

async function connectDB() {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    throw new Error('MONGO_URI is not defined in your .env file.');
  }

  try {
    const conn = await mongoose.connect(uri, {
      
      
    });

    console.log(`✓ MongoDB connected: ${conn.connection.host}`);
  } catch (err) {
    console.error(`✗ MongoDB connection failed: ${err.message}`);
    process.exit(1); 
  }
}


mongoose.connection.on('disconnected', () => {
  console.warn('⚠ MongoDB disconnected.');
});

process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('MongoDB connection closed (SIGINT).');
  process.exit(0);
});

module.exports = connectDB;

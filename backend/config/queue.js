const { Queue } = require('bullmq');
const IORedis = require('ioredis');
require('dotenv').config();

// Setup Redis connection options
const redisConnection = new IORedis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  maxRetriesPerRequest: null // This parameter is mandatory for BullMQ to handle reconnects properly
});

// Define and initialize the BullMQ queue
const deploymentQueue = new Queue('deploymentQueue', {
  connection: redisConnection
});

// Logs status when Redis connects or errors
redisConnection.on('connect', () => {
  console.log('Successfully connected to Redis for BullMQ Queue');
});

redisConnection.on('error', (err) => {
  console.error('Redis Queue connection error:', err.message);
});

module.exports = {
  deploymentQueue,
  redisConnection
};

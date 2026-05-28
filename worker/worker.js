const { Worker } = require('bullmq');
const IORedis = require('ioredis');
const mongoose = require('mongoose');
require('dotenv').config();

const Deployment = require('./models/Deployment');
const { executeDocker } = require('./services/dockerService');
const { notifyAWSLambda } = require('./services/awsService');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/hosting-control-panel';
const REDIS_HOST = process.env.REDIS_HOST || 'localhost';
const REDIS_PORT = parseInt(process.env.REDIS_PORT || '6379');

// Helper to update logs in real-time in MongoDB
async function createLogger(deploymentId) {
  return async (message) => {
    const timestampedMessage = `[${new Date().toLocaleTimeString()}] ${message}`;
    console.log(`[Job ${deploymentId}] ${timestampedMessage}`);
    
    // Atomically push the log line to MongoDB so the frontend can retrieve it instantly
    await Deployment.findByIdAndUpdate(deploymentId, {
      $push: { logs: timestampedMessage }
    });
  };
}

console.log('Worker connecting to MongoDB...');
mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('Worker successfully connected to MongoDB.');
    startWorker();
  })
  .catch((err) => {
    console.error('Worker failed to connect to database:', err.message);
    process.exit(1);
  });

function startWorker() {
  // Configured Redis connection for BullMQ
  const redisConnection = new IORedis({
    host: REDIS_HOST,
    port: REDIS_PORT,
    maxRetriesPerRequest: null
  });

  console.log(`Worker listening for jobs on Queue: "deploymentQueue" via Redis ${REDIS_HOST}:${REDIS_PORT}...`);

  const worker = new Worker('deploymentQueue', async (job) => {
    const { deploymentId } = job.data;
    console.log(`\n---------------------------------------------`);
    console.log(`Processing deployment job: ${deploymentId}`);
    
    const log = await createLogger(deploymentId);
    
    // 1. Fetch deployment details
    const deployment = await Deployment.findById(deploymentId);
    if (!deployment) {
      console.error(`Deployment job failed: Record not found for ID ${deploymentId}`);
      return;
    }

    try {
      // 2. Set Status to Deploying
      deployment.status = 'Deploying';
      await deployment.save();
      await log(`[System] Worker picked up job. Launching hosting setup...`);

      // 3. Step 1: Run Docker Container (Real/Simulated)
      await log(`[System] Executing Container Provisioning step...`);
      const dockerResult = await executeDocker(deployment.image, deployment.domain, log);

      if (!dockerResult.success) {
        throw new Error('Docker container setup failed.');
      }

      // 4. Step 2: Trigger Cloud Operations (AWS Lambda)
      await log(`[System] Executing Cloud Infrastructure step...`);
      const awsResult = await notifyAWSLambda(deployment, dockerResult, log);

      if (!awsResult.success) {
        await log(`[Warning] AWS Cloud integration returned a failure state. Proceeding anyway...`);
      }

      // 5. Update Status to Completed
      await Deployment.findByIdAndUpdate(deploymentId, {
        status: 'Completed',
        $push: { logs: `[${new Date().toLocaleTimeString()}] [System] Deployment completed successfully! Container active.` }
      });
      console.log(`Job ${deploymentId} completed successfully.`);

    } catch (error) {
      console.error(`Error processing job ${deploymentId}:`, error);
      
      // Update Status to Failed
      await Deployment.findByIdAndUpdate(deploymentId, {
        status: 'Failed',
        $push: { logs: `[${new Date().toLocaleTimeString()}] [Error] Deployment failed: ${error.message}` }
      });
    }
  }, {
    connection: redisConnection,
    concurrency: 1 // Process one deployment at a time
  });

  worker.on('failed', (job, err) => {
    console.error(`Job ${job ? job.id : 'unknown'} failed check:`, err.message);
  });
}

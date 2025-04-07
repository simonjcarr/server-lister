import { Worker } from "bullmq"
import IORedis from "ioredis"
import dotenv from "dotenv"
import { insertScan } from "@/app/actions/scan/crudActions"
import { getTestDatabaseName } from "@/db"

// Check if we're running in a test environment
const isTestEnvironment = process.env.NODE_ENV === 'test' || process.env.CYPRESS_TESTING === 'true';

// Determine which dotenv file to use
if (isTestEnvironment) {
  dotenv.config({ path: '.env.test' })
  console.log('Worker using test environment configuration')
  
  // Check if we have a test database name from our file-based storage
  const testDbName = getTestDatabaseName()
  if (testDbName) {
    process.env.DATABASE_NAME = testDbName
    process.env.TEST_DATABASE_NAME = testDbName
    process.env.DYNAMIC_TEST_DB = testDbName
    console.log(`Worker using test database: ${testDbName}`)
  }
} else {
  dotenv.config()
  console.log('Worker using production environment configuration')
  
  // Clear any old test database names from the environment
  if (process.env.DATABASE_URL !== 'test') {
    // If we're in production mode, make sure we're not using any test database names
    delete process.env.DYNAMIC_TEST_DB;
    delete process.env.TEST_DATABASE_NAME;
  }
}

if (!process.env.REDIS_USER || !process.env.REDIS_PASSWORD) {
  throw new Error('REDIS_USER or REDIS_PASSWORD is not defined in .env')
}

const redisUrl = new URL(process.env.REDIS_URL || 'redis://localhost:6379')

const connection = new IORedis({
  host: redisUrl.hostname,
  port: Number(redisUrl.port || 6379),
  username: process.env.REDIS_USER,
  password: process.env.REDIS_PASSWORD,
  maxRetriesPerRequest: null
})

if (!process.env.API_URL) {
  throw new Error('API_URL is not defined in .env.local')
}

const postNotification = async (title: string, message: string, roleNames?: string[], userIds?: string[]) => {
  try {
    const response = await fetch(`${process.env.API_URL}/api/workers/notification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ title, message, roleNames, userIds })
    });
    
    if (!response.ok) {
      throw new Error(`Failed to send notification: ${response.status} ${response.statusText}`);
    }
    
    // The API now returns notifications as a direct array
    const notifications = await response.json();
    
    // Process notifications if we have an array
    if (Array.isArray(notifications) && notifications.length > 0) {
      for (const notification of notifications) {
        try {
          // Send SSE event for this notification
          await fetch(`${process.env.API_URL}/api/sse/notify`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              userId: notification.userId,
              event: 'notification',
              data: notification
            })
          });
        } catch (error) {
          console.error('Error sending SSE notification:', error);
        }
      }
    }
    
    return notifications;
  } catch (error) {
    console.error(`Error in postNotification:`, error);
    throw error;
  }
}

const worker = new Worker(
  'jobQueue',
  async job => {
    try {
      switch (job.name) {
        case 'notification':
          await postNotification(job.data.title, job.data.message, job.data.roleNames, job.data.userIds);
          break;
        case 'serverScan':
          console.log('Processing serverScan job with data:', job.data);
          await insertScan(job.data);
          break;
        case 'email':
          // Email job processing would go here
          break;
        default:
          throw new Error('Unknown job type');
      }
    } catch (error) {
      console.error(`Error processing ${job.name} job:`, error);
      throw error;
    }
  },
  { connection }
);

worker.on('error', (error) => {
  console.error('BullMQ Worker error:', error);
});

worker.on('ready', () => {
  console.log('BullMQ Worker started');
});

// Handle process termination gracefully
process.on('SIGTERM', async () => {
  await worker.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  await worker.close();
  process.exit(0);
});

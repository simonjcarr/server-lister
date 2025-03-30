import { Worker } from "bullmq"
import IORedis from "ioredis"
import dotenv from "dotenv"
import { insertScan } from "@/app/actions/scan/crudActions"

dotenv.config()

const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
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

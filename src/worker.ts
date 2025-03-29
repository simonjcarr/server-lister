import { Worker } from "bullmq"
import IORedis from "ioredis"
import dotenv from "dotenv"
import { insertScan } from "@/app/actions/scan/crudActions"
import { SelectNotification } from "@/db/schema"

dotenv.config()

const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null
})

if (!process.env.API_URL) {
  throw new Error('API_URL is not defined in .env.local')
}

const postNotification = async (title: string, message: string, roleNames?: string[], userIds?: string[]) => {
  console.log(`Worker: Sending notification "${title}" to ${roleNames?.length || 0} roles and ${userIds?.length || 0} users`);
  
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
    console.log(`Worker: Response from notification API (type: ${Array.isArray(notifications) ? 'array' : typeof notifications})`, 
      Array.isArray(notifications) ? `length: ${notifications.length}` : JSON.stringify(notifications).substring(0, 200));
    
    // Process notifications if we have an array
    if (Array.isArray(notifications) && notifications.length > 0) {
      console.log(`Worker: Sending SSE events for ${notifications.length} notifications`);
      
      for (const notification of notifications) {
        try {
          console.log(`Worker: Processing notification ID ${notification.id} for user ${notification.userId}`);
          
          // Send SSE event for this notification
          const sseResponse = await fetch(`${process.env.API_URL}/api/sse/notify`, {
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
          
          const sseResult = await sseResponse.json();
          console.log(`Worker: SSE notification ${notification.id} sent to user ${notification.userId}: ${sseResult.success ? 'SUCCESS' : 'FAILED'}`);
          
          if (!sseResult.success) {
            console.log(`Worker: SSE delivery failed - ${sseResult.message}`);
          }
        } catch (error) {
          console.error(`Worker: Error sending SSE for notification ${notification.id}:`, error);
        }
      }
    } else {
      console.log(`Worker: No notifications returned from API to process`);
    }
    
    return notifications;
  } catch (error) {
    console.error(`Worker: Error in postNotification:`, error);
    throw error;
  }
}

const worker = new Worker(
  'jobQueue',
  async job => {
    try {
      console.log(`Worker: Processing ${job.name} job`, job.data);
      
      switch (job.name) {
        case 'notification':
          await postNotification(job.data.title, job.data.message, job.data.roleNames, job.data.userIds);
          break;
        case 'serverScan':
          console.log('Worker: Server scan job');
          await insertScan(job.data);
          break;
        case 'email':
          console.log('Worker: Email job');
          break;
        default:
          throw new Error('Unknown job type');
      }
      
      console.log(`Worker: Successfully completed ${job.name} job`);
    } catch (error) {
      console.error(`Worker: Error processing ${job.name} job:`, error);
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
  console.log('Worker: Received SIGTERM, closing worker...');
  await worker.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('Worker: Received SIGINT, closing worker...');
  await worker.close();
  process.exit(0);
});

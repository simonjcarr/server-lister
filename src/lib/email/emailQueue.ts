import { Queue } from 'bullmq';
import IORedis from 'ioredis';
import { EmailData } from './emailService';

// Use the same Redis connection as worker.ts
const redisUrl = new URL(process.env.REDIS_URL || 'redis://localhost:6379');

const connection = new IORedis({
  host: redisUrl.hostname,
  port: Number(redisUrl.port || 6379),
  username: process.env.REDIS_USER,
  password: process.env.REDIS_PASSWORD,
  maxRetriesPerRequest: null
});

// Create a queue specifically for email jobs
const emailQueue = new Queue('jobQueue', { connection });

/**
 * Add an email job to the queue
 * @param emailData The email data to be sent
 * @param options Optional job options
 * @returns The job ID
 */
export const queueEmail = async (emailData: EmailData, options?: { priority?: number; delay?: number }) => {
  try {
    const job = await emailQueue.add('email', emailData, {
      priority: options?.priority || 5, // Default priority
      delay: options?.delay || 0,       // Delay in milliseconds before processing
      attempts: 3,                      // Number of retry attempts
      backoff: {
        type: 'exponential',            // Exponential backoff strategy
        delay: 5000                     // Initial delay between attempts
      },
      removeOnComplete: 100,            // Keep only the latest 100 completed jobs
      removeOnFail: 500                 // Keep more failed jobs for debugging
    });
    
    console.log(`Email job queued with ID: ${job.id}`);
    return job.id;
  } catch (error) {
    console.error('Error queuing email job:', error);
    throw error;
  }
};

// Clean up connection on process exit
process.on('exit', () => {
  emailQueue.close();
});

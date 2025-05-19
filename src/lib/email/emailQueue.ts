import { Queue } from 'bullmq';
import IORedis from 'ioredis';
import { EmailData } from './emailService';

// Skip Redis initialization during build time
const isBuildTime = process.env.NODE_ENV === 'production' && process.env.NEXT_PHASE === 'phase-production-build';

// Declare variables that will be initialized conditionally
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let connection: any;
let emailQueue: Queue;

if (!isBuildTime) {
  try {
    // Use the same Redis connection as worker.ts
    const redisUrl = new URL(process.env.REDIS_URL || 'redis://localhost:6379');

    connection = new IORedis({
      host: redisUrl.hostname,
      port: Number(redisUrl.port || 6379),
      username: process.env.REDIS_USER,
      password: process.env.REDIS_PASSWORD,
      maxRetriesPerRequest: null
    });

    // Create a queue specifically for email jobs
    emailQueue = new Queue('jobQueue', { connection });

    // Clean up connection on process exit
    process.on('exit', () => {
      emailQueue.close();
    });
  } catch (error) {
    console.error('Error initializing Redis connection:', error);
    // Provide fallbacks if Redis connection fails
    connection = {};
    emailQueue = {} as Queue;
  }
} else {
  // During build time, use dummy implementations
  connection = {};
  emailQueue = {} as Queue;
}

/**
 * Add an email job to the queue
 * @param emailData The email data to be sent
 * @param options Optional job options
 * @returns The job ID
 */
export const queueEmail = async (emailData: EmailData, options?: { priority?: number; delay?: number }) => {
  // Skip actual queue operations during build
  if (isBuildTime) return 'build-time-mock-id';
  
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

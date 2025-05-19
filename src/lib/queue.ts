import { Queue } from "bullmq"
import IORedis from "ioredis"

// Skip Redis initialization during build time
const isBuildTime = process.env.NODE_ENV === 'production' && process.env.NEXT_PHASE === 'phase-production-build';

// Use a dummy connection for build time
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let connection: any;
let jobQueue: Queue;

if (!isBuildTime) {
  if (!process.env.REDIS_URL) {
    throw new Error('REDIS_URL is not defined in .env')
  }

  // if (!process.env.REDIS_USER || !process.env.REDIS_PASSWORD) {
  //   throw new Error('REDIS_USER or REDIS_PASSWORD is not defined in .env')
  // }

  connection = new IORedis({
    host: new URL(process.env.REDIS_URL).hostname,
    port: Number(new URL(process.env.REDIS_URL).port || 6379),
    username: process.env.REDIS_USER,
    password: process.env.REDIS_PASSWORD
  });

  jobQueue = new Queue('jobQueue', { connection });
} else {
  // During build time, use a dummy implementation that doesn't connect to Redis
  connection = {};
  jobQueue = {} as Queue;
}

export { jobQueue }
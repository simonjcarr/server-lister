import { Queue } from "bullmq"
import IORedis from "ioredis"

if (!process.env.REDIS_URL) {
  throw new Error('REDIS_URL is not defined in .env.local')
}

const connection = new IORedis(process.env.REDIS_URL)

export const jobQueue = new Queue('jobQueue', { connection })
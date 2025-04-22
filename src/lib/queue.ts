import { Queue } from "bullmq"
import IORedis from "ioredis"

if (!process.env.REDIS_URL) {
  throw new Error('REDIS_URL is not defined in .env')
}

// if (!process.env.REDIS_USER || !process.env.REDIS_PASSWORD) {
//   throw new Error('REDIS_USER or REDIS_PASSWORD is not defined in .env')
// }

const connection = new IORedis({
  host: new URL(process.env.REDIS_URL).hostname,
  port: Number(new URL(process.env.REDIS_URL).port || 6379),
  username: process.env.REDIS_USER,
  password: process.env.REDIS_PASSWORD
})

export const jobQueue = new Queue('jobQueue', { connection })
import { Worker } from "bullmq"
import IORedis from "ioredis"

const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null
})

new Worker(
  'jobQueue',
  async job => {
    switch (job.name) {
      case 'notification':
        console.log('Notification job')
        break
      case 'email':
        console.log('Email job')
        break
      default:
        throw new Error('Unknown job type')
    }
  },
  { connection }
)

console.log('BullMQ Worker started')
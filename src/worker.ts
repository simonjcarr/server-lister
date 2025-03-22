import { Worker } from "bullmq"
import IORedis from "ioredis"
import dotenv from "dotenv"

dotenv.config()

console.log(process.env)

const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null
})

if (!process.env.API_URL) {
  throw new Error('API_URL is not defined in .env.local')
}

const postNotification = async (title: string, message: string, roleNames?: string[], userIds?: string[]) => {
  const response = await fetch(`${process.env.API_URL}/api/workers/notification`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ title, message, roleNames, userIds })
  })
  if (!response.ok) {
    throw new Error(`Failed to send notification: ${response.status} ${response.statusText}`)
  }
  return response
}


const worker =new Worker(
  'jobQueue',
  async job => {
    switch (job.name) {
      case 'notification':
        console.log('Notification job')
        await postNotification(job.data.title, job.data.message, job.data.roleNames, job.data.userIds)
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
worker.on('error', (error) => {
  console.error('BullMQ Worker error:', error)
})
worker.on('ready', () => {
  console.log('BullMQ Worker started')
})

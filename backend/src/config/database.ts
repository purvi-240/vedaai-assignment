import mongoose from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'
import { env } from './env.js'

let memoryServer: MongoMemoryServer | null = null

export async function connectDatabase(): Promise<void> {
  try {
    await mongoose.connect(env.MONGODB_URI, { serverSelectionTimeoutMS: 4000 })
    console.log(`MongoDB connected (${env.MONGODB_URI})`)
    return
  } catch (error) {
    if (env.NODE_ENV === 'production') {
      throw error
    }

    console.warn('MongoDB unavailable, starting in-memory database for development...')
    memoryServer = await MongoMemoryServer.create()
    const uri = memoryServer.getUri()
    await mongoose.connect(uri)
    console.log('MongoDB connected (in-memory dev fallback)')
  }
}

export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect()
  if (memoryServer) {
    await memoryServer.stop()
    memoryServer = null
  }
}

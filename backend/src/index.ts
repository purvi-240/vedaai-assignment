import 'dotenv/config'
import { createServer } from 'http'
import { createApp } from './app.js'
import { connectDatabase } from './config/database.js'
import { env } from './config/env.js'
import { initRedis } from './config/redis.js'
import { initAssignmentQueue } from './queues/assignmentQueue.js'
import { setupWebSocket } from './websocket/server.js'

async function bootstrap(): Promise<void> {
  await connectDatabase()
  await initRedis()
  initAssignmentQueue()

  const app = createApp()
  const server = createServer(app)

  setupWebSocket(server)

  server.listen(env.PORT, () => {
    console.log(`Server running on http://localhost:${env.PORT}`)
    console.log(`WebSocket available at ws://localhost:${env.PORT}/ws`)
  })
}

bootstrap().catch((error) => {
  console.error('Failed to start server:', error)
  process.exit(1)
})

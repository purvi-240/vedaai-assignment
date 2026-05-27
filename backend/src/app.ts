import express from 'express'
import cors from 'cors'
import { assignmentsRouter } from './routes/assignments.js'

export function createApp() {
  const app = express()

  app.use(cors())
  app.use(express.json())

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' })
  })

  app.use('/api/assignments', assignmentsRouter)

  return app
}

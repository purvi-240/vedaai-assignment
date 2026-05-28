import express from 'express'
import cors from 'cors'
import { env } from './config/env.js'
import { assignmentsRouter } from './routes/assignments.js'
import { referenceRouter } from './routes/reference.js'

export function createApp() {
  const app = express()

  app.use(cors())
  app.use(express.json())

  app.get('/health', (_req, res) => {
    res.json({
      status: 'ok',
      aiEnabled: Boolean(env.OPENAI_API_KEY),
      model: env.LLM_MODEL,
    })
  })

  app.use('/api/assignments', assignmentsRouter)
  app.use('/api/reference', referenceRouter)

  return app
}

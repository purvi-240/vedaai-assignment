import { WebSocketServer, type WebSocket } from 'ws'
import type { Server } from 'http'
import { getRedisConnection, isRedisAvailable, WS_BROADCAST_CHANNEL } from '../config/redis.js'
import type { WebSocketMessage } from '../types/assignment.js'
import { setBroadcastHandler } from './broadcastBus.js'
import { handleAssignmentCreate } from './handlers.js'

const clients = new Set<WebSocket>()
const assignmentSubscriptions = new Map<string, Set<WebSocket>>()

export function setupWebSocket(server: Server): WebSocketServer {
  const wss = new WebSocketServer({ server, path: '/ws' })

  setBroadcastHandler((message, assignmentId) => {
    if (assignmentId) {
      broadcastToAssignment(assignmentId, message)
    } else {
      broadcast(message)
    }
  })

  if (isRedisAvailable()) {
    const redis = getRedisConnection()!
    redis.subscribe(WS_BROADCAST_CHANNEL)
    redis.on('message', (channel: string, message: string) => {
      if (channel === WS_BROADCAST_CHANNEL) {
        try {
          const parsed = JSON.parse(message) as {
            assignmentId?: string
            message: WebSocketMessage
          }
          if (parsed.assignmentId) {
            broadcastToAssignment(parsed.assignmentId, parsed.message)
          } else {
            broadcast(parsed.message)
          }
        } catch {
          console.error('Failed to parse Redis broadcast message')
        }
      }
    })
  }

  wss.on('connection', (ws) => {
    clients.add(ws)

    ws.on('message', async (data) => {
      try {
        const message = JSON.parse(data.toString()) as WebSocketMessage
        await handleClientMessage(ws, message)
      } catch (error) {
        ws.send(
          JSON.stringify({
            type: 'error',
            payload: error instanceof Error ? error.message : 'Invalid message',
          }),
        )
      }
    })

    ws.on('close', () => {
      clients.delete(ws)
      assignmentSubscriptions.forEach((subs) => subs.delete(ws))
    })

    ws.send(JSON.stringify({ type: 'connected', payload: { message: 'WebSocket ready' } }))
  })

  console.log('WebSocket server ready at /ws')
  return wss
}

async function handleClientMessage(ws: WebSocket, message: WebSocketMessage): Promise<void> {
  switch (message.type) {
    case 'assignment:create':
      await handleAssignmentCreate(message.payload)
      ws.send(
        JSON.stringify({
          type: 'assignment:created',
          payload: { message: 'Assignment created successfully' },
        }),
      )
      break
    case 'assignment:subscribe': {
      const assignmentId = (message.payload as { assignmentId?: string })?.assignmentId
      if (assignmentId) {
        subscribeToAssignment(ws, assignmentId)
      }
      break
    }
    default:
      break
  }
}

function subscribeToAssignment(ws: WebSocket, assignmentId: string): void {
  if (!assignmentSubscriptions.has(assignmentId)) {
    assignmentSubscriptions.set(assignmentId, new Set())
  }
  assignmentSubscriptions.get(assignmentId)!.add(ws)

  ws.send(
    JSON.stringify({
      type: 'assignment:subscribed',
      payload: { assignmentId },
    }),
  )
}

export function broadcast(message: WebSocketMessage): void {
  const data = JSON.stringify(message)
  clients.forEach((client) => {
    if (client.readyState === client.OPEN) {
      client.send(data)
    }
  })
}

export function broadcastToAssignment(
  assignmentId: string,
  message: WebSocketMessage,
): void {
  const subs = assignmentSubscriptions.get(assignmentId)
  const data = JSON.stringify(message)

  if (subs) {
    subs.forEach((client) => {
      if (client.readyState === client.OPEN) {
        client.send(data)
      }
    })
  }

  broadcast(message)
}

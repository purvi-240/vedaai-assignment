import { getRedisPublisher, isRedisAvailable, WS_BROADCAST_CHANNEL } from '../config/redis.js'
import type { WebSocketMessage } from '../types/assignment.js'
import { emitBroadcast } from './broadcastBus.js'

export async function publishBroadcast(
  message: WebSocketMessage,
  assignmentId?: string,
): Promise<void> {
  if (isRedisAvailable()) {
    await getRedisPublisher()!.publish(
      WS_BROADCAST_CHANNEL,
      JSON.stringify({ assignmentId, message }),
    )
    return
  }

  emitBroadcast(message, assignmentId)
}

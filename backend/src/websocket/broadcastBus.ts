type BroadcastHandler = (
  message: { type: string; payload?: unknown },
  assignmentId?: string,
) => void

let broadcastHandler: BroadcastHandler | null = null

export function setBroadcastHandler(handler: BroadcastHandler): void {
  broadcastHandler = handler
}

export function emitBroadcast(
  message: { type: string; payload?: unknown },
  assignmentId?: string,
): void {
  broadcastHandler?.(message, assignmentId)
}

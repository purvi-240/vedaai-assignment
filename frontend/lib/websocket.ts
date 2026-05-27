import type { WebSocketMessage, WebSocketStatus } from '@/types/assignment'

type MessageHandler = (message: WebSocketMessage) => void
type StatusHandler = (status: WebSocketStatus) => void

export class WebSocketManager {
  private socket: WebSocket | null = null
  private url: string
  private messageHandlers = new Set<MessageHandler>()
  private statusHandlers = new Set<StatusHandler>()
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectTimeoutId: ReturnType<typeof setTimeout> | null = null
  private shouldReconnect = true

  constructor(url: string) {
    this.url = url
  }

  connect(): void {
    if (this.socket?.readyState === WebSocket.OPEN) return

    this.updateStatus('connecting')

    try {
      this.socket = new WebSocket(this.url)

      this.socket.onopen = () => {
        this.reconnectAttempts = 0
        this.updateStatus('connected')
      }

      this.socket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data as string) as WebSocketMessage
          this.messageHandlers.forEach((handler) => handler(message))
        } catch {
          this.messageHandlers.forEach((handler) =>
            handler({ type: 'raw', payload: event.data }),
          )
        }
      }

      this.socket.onerror = () => {
        this.updateStatus('error')
      }

      this.socket.onclose = () => {
        this.updateStatus('disconnected')
        this.scheduleReconnect()
      }
    } catch {
      this.updateStatus('error')
      this.scheduleReconnect()
    }
  }

  disconnect(): void {
    this.shouldReconnect = false
    if (this.reconnectTimeoutId) {
      clearTimeout(this.reconnectTimeoutId)
      this.reconnectTimeoutId = null
    }
    this.socket?.close()
    this.socket = null
    this.updateStatus('disconnected')
  }

  send(message: WebSocketMessage): void {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(message))
    }
  }

  onMessage(handler: MessageHandler): () => void {
    this.messageHandlers.add(handler)
    return () => this.messageHandlers.delete(handler)
  }

  onStatusChange(handler: StatusHandler): () => void {
    this.statusHandlers.add(handler)
    return () => this.statusHandlers.delete(handler)
  }

  private updateStatus(status: WebSocketStatus): void {
    this.statusHandlers.forEach((handler) => handler(status))
  }

  private scheduleReconnect(): void {
    if (!this.shouldReconnect || this.reconnectAttempts >= this.maxReconnectAttempts) {
      return
    }

    const delay = Math.min(1000 * 2 ** this.reconnectAttempts, 10000)
    this.reconnectAttempts += 1

    this.reconnectTimeoutId = setTimeout(() => {
      this.connect()
    }, delay)
  }
}

const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? 'ws://localhost:8080/ws'

export const websocketManager = new WebSocketManager(WS_URL)

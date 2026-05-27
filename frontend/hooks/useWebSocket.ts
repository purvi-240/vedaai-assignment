'use client'

import { useEffect } from 'react'
import { websocketManager } from '@/lib/websocket'
import { useAssignmentStore } from '@/store/assignmentStore'
import type { WebSocketMessage } from '@/types/assignment'

export function useWebSocket() {
  const setWsStatus = useAssignmentStore((state) => state.setWsStatus)
  const setLastMessage = useAssignmentStore((state) => state.setLastMessage)

  useEffect(() => {
    const unsubscribeStatus = websocketManager.onStatusChange(setWsStatus)
    const unsubscribeMessage = websocketManager.onMessage((message: WebSocketMessage) => {
      setLastMessage(message)
    })

    websocketManager.connect()

    return () => {
      unsubscribeStatus()
      unsubscribeMessage()
      websocketManager.disconnect()
    }
  }, [setWsStatus, setLastMessage])

  return {
    send: websocketManager.send.bind(websocketManager),
    status: useAssignmentStore((state) => state.wsStatus),
  }
}

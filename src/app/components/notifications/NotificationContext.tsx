'use client'

import { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react'
import { Badge, notification, Button } from 'antd'
import { BellOutlined } from '@ant-design/icons'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
import Link from 'next/link'

// Define notification shape
export interface UserNotification {
  id: number
  userId: string
  title: string
  message: string
  read: boolean
  createdAt: string
  updatedAt: string
}

// Context interface
interface NotificationContextType {
  notifications: UserNotification[]
  unreadCount: number
  markAsRead: (id: number) => Promise<void>
  markAllAsRead: () => Promise<void>
  deleteNotifications: (ids: number[]) => Promise<void>
}

// Create context
const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

// Provider component
export function NotificationProvider({ children }: { children: ReactNode }) {
  const { data: session } = useSession()
  const queryClient = useQueryClient()
  const [api, contextHolder] = notification.useNotification()
  const eventSourceRef = useRef<EventSource | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const [sseConnected, setSseConnected] = useState(false)

  // Fetch notifications
  const { data: notifications = [] } = useQuery<UserNotification[]>({
    queryKey: ['notifications', session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id) return []
      
      try {
        const res = await fetch('/api/notifications')
        if (!res.ok) throw new Error('Failed to fetch notifications')
        return res.json()
      } catch (error) {
        console.error('Error fetching notifications:', error)
        return []
      }
    },
    enabled: !!session?.user?.id,
    // We're using SSE instead of polling
  })

  // Calculate unread count
  const unreadCount = notifications.filter(n => !n.read).length

  // Mark a notification as read
  const markAsRead = async (id: number) => {
    try {
      const res = await fetch(`/api/notifications/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ read: true }),
      })
      
      if (!res.ok) throw new Error('Failed to mark notification as read')
      
      // Invalidate query to refresh the notifications
      queryClient.invalidateQueries({ queryKey: ['notifications', session?.user?.id] })
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      const res = await fetch('/api/notifications/mark-all-read', {
        method: 'POST',
      })
      
      if (!res.ok) throw new Error('Failed to mark all notifications as read')
      
      // Invalidate query to refresh the notifications
      queryClient.invalidateQueries({ queryKey: ['notifications', session?.user?.id] })
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
    }
  }

  // Delete multiple notifications
  const deleteNotifications = async (ids: number[]) => {
    try {
      const res = await fetch('/api/notifications/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      })
      
      if (!res.ok) throw new Error('Failed to delete notifications')
      
      // Invalidate query to refresh the notifications
      queryClient.invalidateQueries({ queryKey: ['notifications', session?.user?.id] })
    } catch (error) {
      console.error('Error deleting notifications:', error)
    }
  }

  // Function to establish SSE connection
  const connectToSSE = () => {
    if (!session?.user?.id) return
    
    try {
      console.log('SSE Client: Setting up SSE connection for user', session.user.id)
      
      // Close any existing connection
      if (eventSourceRef.current) {
        console.log('SSE Client: Closing existing connection')
        eventSourceRef.current.close()
        eventSourceRef.current = null
      }
      
      // Clear any existing reconnect timeout
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
        reconnectTimeoutRef.current = null
      }
      
      // Add a timestamp to prevent caching issues
      const timestamp = new Date().getTime()
      const eventSource = new EventSource(`/api/sse/notifications?t=${timestamp}`)
      eventSourceRef.current = eventSource
      
      // Handle connection open
      eventSource.addEventListener('connected', (event) => {
        console.log('SSE Client: Connection established successfully!')
        setSseConnected(true)
      })
      
      // Handle notification events
      eventSource.addEventListener('notification', (event) => {
        console.log('SSE Client: Received notification event data:', event.data)
        
        try {
          // Parse the notification data
          const newNotification = JSON.parse(event.data) as UserNotification
          console.log('SSE Client: Parsed notification:', newNotification)
          
          // Invalidate the query to refresh the notifications list
          queryClient.invalidateQueries({ queryKey: ['notifications', session.user.id] })
          
          // Extract server ID from notification message if it's a chat notification
          const serverIdMatch = newNotification.message.match(/on\s+(\w+):/i)
          const hostname = serverIdMatch?.[1]
          
          // Show a toast notification
          api.open({
            message: newNotification.title,
            description: (
              <div>
                {newNotification.message}
                {hostname && (
                  <div className="mt-2">
                    <Link href={`/servers?hostname=${hostname}`}>
                      <Button size="small" type="primary">View Server</Button>
                    </Link>
                  </div>
                )}
              </div>
            ),
            placement: 'topRight',
            duration: 5,
            onClick: () => {
              markAsRead(newNotification.id)
            },
          })
        } catch (error) {
          console.error('SSE Client: Error processing notification event:', error)
        }
      })
      
      // Handle connection error
      eventSource.onerror = (error) => {
        console.error('SSE Client: Connection error:', error)
        setSseConnected(false)
        
        // Clean up the current connection
        if (eventSourceRef.current) {
          eventSourceRef.current.close()
          eventSourceRef.current = null
        }
        
        // Attempt to reconnect after a delay
        if (!reconnectTimeoutRef.current) {
          console.log('SSE Client: Scheduling reconnection attempt in 5 seconds...')
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log('SSE Client: Attempting to reconnect...')
            reconnectTimeoutRef.current = null
            connectToSSE() // Try to reconnect
          }, 5000)
        }
      }
    } catch (error) {
      console.error('SSE Client: Error setting up SSE connection:', error)
      setSseConnected(false)
    }
  }
  
  // Set up SSE connection
  useEffect(() => {
    connectToSSE()
    
    // Clean up on unmount
    return () => {
      if (eventSourceRef.current) {
        console.log('SSE Client: Cleaning up SSE connection on unmount')
        eventSourceRef.current.close()
        eventSourceRef.current = null
      }
      
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
        reconnectTimeoutRef.current = null
      }
    }
  }, [session?.user?.id]) // Re-connect if user ID changes

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, markAsRead, markAllAsRead, deleteNotifications }}>
      {contextHolder}
      {children}
    </NotificationContext.Provider>
  )
}

// Custom hook to use the notification context
export function useNotifications() {
  const context = useContext(NotificationContext)
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider')
  }
  return context
}

// Component for the notification icon in the header
export function NotificationBadge() {
  const { unreadCount } = useNotifications()
  
  return (
    <Badge count={unreadCount} size="small">
      <BellOutlined style={{ fontSize: '18px' }} />
    </Badge>
  )
}

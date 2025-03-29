'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
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
}

// Create context
const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

// Provider component
export function NotificationProvider({ children }: { children: ReactNode }) {
  const { data: session } = useSession()
  const queryClient = useQueryClient()
  const [api, contextHolder] = notification.useNotification()

  // Fetch notifications
  const { data: notifications = [] } = useQuery<UserNotification[]>({
    queryKey: ['notifications', session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id) return []
      
      const res = await fetch('/api/notifications')
      if (!res.ok) throw new Error('Failed to fetch notifications')
      return res.json()
    },
    enabled: !!session?.user?.id,
    refetchInterval: 30000, // Refresh every 30 seconds
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

  // Show notification toasts for new unread notifications
  useEffect(() => {
    if (notifications.length === 0) return

    // Check for unread notifications
    const unreadNotifications = notifications.filter(n => !n.read)
    if (unreadNotifications.length === 0) return

    // Only show the most recent unread notification as a toast
    const latestNotification = unreadNotifications.reduce((latest, current) => {
      return new Date(current.createdAt) > new Date(latest.createdAt) ? current : latest
    }, unreadNotifications[0])

    // Extract server ID from notification message if it's a chat notification
    const serverIdMatch = latestNotification.message.match(/on\s+(\w+):/i)
    const hostname = serverIdMatch?.[1]

    api.open({
      message: latestNotification.title,
      description: (
        <div>
          {latestNotification.message}
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
        markAsRead(latestNotification.id)
      },
    })
  }, [notifications, api])

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, markAsRead, markAllAsRead }}>
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

'use client'
import { Badge, notification } from 'antd'
import React, { useCallback, useEffect, useState, memo } from 'react'
import { useQuery } from "@tanstack/react-query"
import { useSession } from 'next-auth/react' 
import ViewNotificationsModal from './ViewNotificationsModal'

// Memoize the component to prevent unnecessary re-renders from parent components
const NotificationCountBadge = memo(({ children }: { children: React.ReactNode }) => {
  const [api, contextHolder] = notification.useNotification();
  const [count, setCount] = useState<number | null>(null)
  const session = useSession()
  
  const openNotification = useCallback(() => {
    api.open({
      message: 'Notifications',
      description: (
        <>
          <p>You have new notifications</p>
          <ViewNotificationsModal><div className='mt-4 cursor-pointer text-blue-500'>View your notifications</div></ViewNotificationsModal>
        </>
      ),
      duration: 3.5,
      type: 'info',
      placement: 'bottomRight'
    })
  }, [api])

  // Ensure we're only fetching when authenticated
  const enabled = session.status === 'authenticated'

  // Use React Query with an API route instead of a server action
  const {data} = useQuery({
    queryKey: ['unreadNotificationCount'],
    queryFn: async () => {
      const response = await fetch('/api/notifications/count')
      if (!response.ok) {
        throw new Error('Failed to fetch notification count')
      }
      const data = await response.json()
      return data.count
    },
    refetchInterval: 5000, // Keep the 5-second polling
    enabled, // Only run the query when authenticated
    notifyOnChangeProps: ['data'],
    refetchOnWindowFocus: false,
  })

  // Only update state and trigger notification when count actually changes
  useEffect(() => {
    if (data === undefined) return
    if (count !== null && data > count) { 
      openNotification() 
    }
    if (count !== data) { // Only update state when there's an actual change
      setCount(data)
    }
  }, [data, count, openNotification])

  if (!enabled) {
    return <>{children}</>
  }

  // Use regular Badge without memoization as it's already efficient
  return (
    <>
      {contextHolder}
      <Badge count={data} showZero={false}>
        {children}
      </Badge>
    </>
  )
})

// Add displayName to the memoized component
NotificationCountBadge.displayName = 'NotificationCountBadge';

export default NotificationCountBadge
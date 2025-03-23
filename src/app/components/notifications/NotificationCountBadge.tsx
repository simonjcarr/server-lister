'use client'
import { Badge } from 'antd'
import React from 'react'
import { getUnreadNotificationCount } from '@/app/actions/notifications/crudActions'
import { useQuery } from "@tanstack/react-query"
import { useSession } from 'next-auth/react' 

const NotificationCountBadge = ({ children }: { children: React.ReactNode }) => {
  const session = useSession()
  if(!session.data) {
    throw new Error('unauthorized')
  }
  const userId = session.data.user.id
  if(!userId) {
    throw new Error('unauthorized')
  }
  const {data} = useQuery({
    queryKey: ['unreadNotificationCount', userId],
    queryFn: () => getUnreadNotificationCount(userId)
  })
  return (
    <Badge count={data} showZero={false}>
      {children}
    </Badge>
  )
}

export default NotificationCountBadge
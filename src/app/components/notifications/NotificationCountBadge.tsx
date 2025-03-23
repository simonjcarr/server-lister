'use client'
import { Badge, notification } from 'antd'
import React, { useCallback, useEffect, useState } from 'react'
import { getUnreadNotificationCount } from '@/app/actions/notifications/crudActions'
import { useQuery } from "@tanstack/react-query"
import { useSession } from 'next-auth/react' 

const NotificationCountBadge = ({ children }: { children: React.ReactNode }) => {
  const [api, contextHolder] = notification.useNotification();

  const [count, setCount] = useState<number | null>(null)
  const session = useSession()
  
  const openNotification = useCallback(() => {
    api.open({
      message: 'Notifications',
      description: 'You have new notifications',
      duration: 3.5,
      type: 'info',
      placement: 'bottomRight'
    })
  }, [api])

  if(!session.data) {
    throw new Error('unauthorized')
  }
  const userId = session.data.user.id
  if(!userId) {
    throw new Error('unauthorized')
  }
  const {data} = useQuery({
    queryKey: ['unreadNotificationCount', userId],
    queryFn: () => getUnreadNotificationCount(userId),
    refetchInterval: 5000
  })

  
  useEffect(() => {
    if(!data) return
    if (count !== null &&data > count) { openNotification() }
    setCount(data)
  }, [data, count, openNotification])

  return (
    <>
      {contextHolder}
      <Badge count={data} showZero={false}>
        {children}
      </Badge>
    </>
  )
}

export default NotificationCountBadge
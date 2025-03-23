import { Badge } from 'antd'
import React from 'react'

const NotificationCountBadge = ({ children }: { children: React.ReactNode }) => {
  return (
    <Badge count={5} showZero={false}>
      {children}
    </Badge>
  )
}

export default NotificationCountBadge
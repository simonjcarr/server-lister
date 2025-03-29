'use client'

import { useState } from 'react'
import { List, Typography, Button, Popover, Empty, Badge, Spin } from 'antd'
import { BellOutlined, CheckOutlined } from '@ant-design/icons'
import { useNotifications } from './NotificationContext'
import { format } from 'date-fns'

export default function NotificationList() {
  const [open, setOpen] = useState(false)
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications()
  const [loading, setLoading] = useState(false)

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
  }

  const handleMarkAllRead = async () => {
    setLoading(true)
    await markAllAsRead()
    setLoading(false)
  }

  const handleMarkRead = async (id: number) => {
    await markAsRead(id)
  }

  const content = (
    <div style={{ width: 300, maxHeight: 400, overflow: 'auto' }}>
      <div className="flex justify-between items-center mb-2 p-2 border-b">
        <Typography.Text strong>Notifications</Typography.Text>
        <Button 
          type="text" 
          size="small" 
          onClick={handleMarkAllRead}
          icon={<CheckOutlined />}
          disabled={unreadCount === 0 || loading}
        >
          {loading ? <Spin size="small" /> : 'Mark all read'}
        </Button>
      </div>
      
      {notifications.length === 0 ? (
        <Empty description="No notifications" />
      ) : (
        <List
          dataSource={notifications}
          renderItem={(notification) => (
            <List.Item 
              className={`cursor-pointer transition-colors ${!notification.read ? 'bg-blue-50' : ''}`}
              onClick={() => handleMarkRead(notification.id)}
            >
              <List.Item.Meta
                title={notification.title}
                description={
                  <>
                    <div>{notification.message}</div>
                    <div className="text-xs text-gray-400 mt-1">
                      {format(new Date(notification.createdAt), 'MMM d, yyyy h:mm a')}
                    </div>
                  </>
                }
              />
            </List.Item>
          )}
        />
      )}
    </div>
  )

  return (
    <Popover
      content={content}
      title={null}
      trigger="click"
      open={open}
      onOpenChange={handleOpenChange}
      arrow={false}
      placement="bottomRight"
    >
      <Badge count={unreadCount} size="small">
        <Button type="text" icon={<BellOutlined />} />
      </Badge>
    </Popover>
  )
}

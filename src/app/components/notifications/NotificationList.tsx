'use client'

import { useState } from 'react'
import { List, Typography, Button, Popover, Empty, Badge, Spin } from 'antd'
import { BellOutlined, CheckOutlined } from '@ant-design/icons'
import { useNotifications } from './NotificationContext'
import { useTheme } from '@/app/theme/ThemeProvider'
import DistanceToNow from '../utils/DistanceToNow'

export default function NotificationList() {
  const [open, setOpen] = useState(false)
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications()
  const { isDarkMode } = useTheme()
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
    <div className={`${isDarkMode ? 'dark:bg-gray-800 dark:text-gray-200' : ''}`} style={{ width: 300, maxHeight: 400, overflow: 'auto' }}>
      <div className={`flex justify-between items-center mb-2 px-4 py-2 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
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
              className={`cursor-pointer transition-colors px-4 ${!notification.read ? (isDarkMode ? 'bg-gray-800' : 'bg-gray-200/50') : 'px-4'}`}
              onClick={() => handleMarkRead(notification.id)}
            >
              <List.Item.Meta
                title={notification.title}
                description={
                  <div className="mt-1">
                    <DistanceToNow date={new Date(notification.createdAt)} />
                  </div>
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
      overlayClassName={isDarkMode ? 'dark-theme-dropdown' : ''}
    >
      <Badge count={unreadCount} size="small">
        <Button type="text" icon={<BellOutlined />} />
      </Badge>
    </Popover>
  )
}

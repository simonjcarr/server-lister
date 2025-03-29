'use client'

import { useState, useMemo } from 'react'
import { List, Typography, Button, Popover, Empty, Badge, Spin, Checkbox, Divider } from 'antd'
import { BellOutlined, CheckOutlined, DeleteOutlined } from '@ant-design/icons'
import { useNotifications } from './NotificationContext'
import { useTheme } from '@/app/theme/ThemeProvider'
import DistanceToNow from '../utils/DistanceToNow'

export default function NotificationList() {
  const [open, setOpen] = useState(false)
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotifications } = useNotifications()
  const { isDarkMode } = useTheme()
  const [loading, setLoading] = useState(false)
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [deleteLoading, setDeleteLoading] = useState(false)

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
    // Clear selections when closing the popover
    if (!newOpen) {
      setSelectedIds([])
    }
  }
  
  const handleSelect = (id: number) => {
    setSelectedIds(prev => 
      prev.includes(id) 
        ? prev.filter(itemId => itemId !== id) 
        : [...prev, id]
    )
  }
  
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(notifications.map(notification => notification.id))
    } else {
      setSelectedIds([])
    }
  }
  
  const handleDelete = async () => {
    if (selectedIds.length === 0) return
    
    setDeleteLoading(true)
    await deleteNotifications(selectedIds)
    setSelectedIds([])
    setDeleteLoading(false)
  }
  
  const allSelected = useMemo(() => {
    return notifications.length > 0 && selectedIds.length === notifications.length
  }, [notifications, selectedIds])

  const handleMarkAllRead = async () => {
    setLoading(true)
    await markAllAsRead()
    setLoading(false)
  }

  const handleMarkRead = async (id: number) => {
    await markAsRead(id)
  }

  const content = (
    <div className={`${isDarkMode ? 'dark:bg-gray-800 dark:text-gray-200' : ''}`} style={{ width: 320, maxHeight: 450, overflow: 'auto' }}>
      <div className={`flex justify-between items-center mb-2 px-4 py-2 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="flex items-center gap-2">
          <Checkbox 
            checked={allSelected} 
            onChange={(e) => handleSelectAll(e.target.checked)}
            disabled={notifications.length === 0}
          />
          <Typography.Text strong>Notifications</Typography.Text>
        </div>
        <div className="flex items-center gap-1">
          {selectedIds.length > 0 && (
            <Button
              type="text"
              size="small"
              danger
              onClick={handleDelete}
              icon={<DeleteOutlined />}
              loading={deleteLoading}
            >
              Delete
            </Button>
          )}
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
      </div>
      
      {notifications.length === 0 ? (
        <Empty description="No notifications" />
      ) : (
        <List
          dataSource={notifications}
          renderItem={(notification) => (
            <List.Item 
              className={`transition-colors px-4 ${!notification.read ? (isDarkMode ? 'bg-gray-800' : 'bg-gray-200/50') : ''}`}
            >
              <div className="flex items-center mr-3">
                <Checkbox 
                  checked={selectedIds.includes(notification.id)}
                  onChange={() => handleSelect(notification.id)}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
              <div 
                className="flex-1 cursor-pointer" 
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
              </div>
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

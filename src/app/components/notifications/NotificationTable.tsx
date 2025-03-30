'use client'
import { Button, Dropdown, MenuProps, Table, TableProps } from 'antd'
import { MoreOutlined } from '@ant-design/icons'
import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { deleteNotifications, getUsersNotifications, markAllNotificationsAsRead, markAllNotificationsAsUnread, markNotificationAsRead, markNotificationAsUnread } from '@/app/actions/notifications/crudActions'
import type { SelectNotification } from '@/db/schema'
import DistanceToNow from '@/app/components/utils/DistanceToNow'
import { Mail, MailOpen } from 'lucide-react'


const NotificationStatusIcon = ({ status }: { status: boolean }) => {
  return (
    <>
      {status ? <MailOpen className='text-gray-500' size={14} /> : <Mail size={16} />}
    </>
  )
}

const NotificationCount = ({ notifications }: { notifications: SelectNotification[] }) => {
  return (
    <div className='text-gray-500 flex items-center gap-2'>
      <div className='flex items-center gap-1'><Mail className='text-gray-500' size={14} />{notifications?.filter((notification) => !notification.read).length || 0}</div>
      <div>|</div>
      <div className='flex items-center gap-1'><MailOpen className='text-gray-500' size={14} />{notifications?.filter((notification) => notification.read).length || 0}</div>
      <div>|</div>
      <div className='flex items-center gap-1'>Total {notifications?.length || 0}</div>
    </div>
  )
}

const DeleteNotificationsButtons = ({ selectedRows, clearSelectedRows }: { selectedRows: SelectNotification[]; clearSelectedRows: () => void }) => {
  const queryClient = useQueryClient()
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      return await markAllNotificationsAsRead()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    }
  })
  const markAllAsUnreadMutation = useMutation({
    mutationFn: async () => {
      return await markAllNotificationsAsUnread()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    }
  })
  const deleteSelectedNotificationsMutation = useMutation({
    mutationFn: async () => {
      return await deleteNotifications(selectedRows.map((row) => row.id))
    },
    onSuccess: () => {
      clearSelectedRows()
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    }
  })
  return (
    <div className='flex items-center gap-2'>
      <Button size='small' type="primary" onClick={() => markAllAsReadMutation.mutate()}>Mark all as read</Button>
      <Button size='small' type="primary" onClick={() => markAllAsUnreadMutation.mutate()}>Mark all as unread</Button>
      {selectedRows.length > 0 && <Button size='small' type="primary" danger onClick={() => deleteSelectedNotificationsMutation.mutate()}>Delete Selected</Button>}
    </div>
  )
}



const RowMenu = ({ notificationId }: { notificationId: number }) => {
  const queryClient = useQueryClient()
  const markAsReadMutation = useMutation({
    mutationFn: async () => {
      return await markNotificationAsRead(notificationId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    }
  })
  const markAsUnreadMutation = useMutation({
    mutationFn: async () => {
      if (!notificationId) return
      return await markNotificationAsUnread(notificationId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    }
  })
  const deleteNotificationMutation = useMutation({
    mutationFn: async () => {
      if (!notificationId) return
      return await deleteNotifications([notificationId])
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    }
  })
  const items: MenuProps['items'] = [
    {
      key: '1',
      label: 'Mark as read',
      onClick: () => {
        markAsReadMutation.mutate()
      }
    },
    {
      key: '2',
      label: 'Mark as unread',
      onClick: () => {
        markAsUnreadMutation.mutate()
      }
    },
    {
      key: '3',
      label: 'Delete',
      onClick: () => {
        deleteNotificationMutation.mutate()
      }
    },
  ]
  return (
    <Dropdown menu={{ items }}>
      <MoreOutlined />
    </Dropdown>
  )
}


const NotificationTable = ({ handleClickNotification }: { handleClickNotification: (notification: SelectNotification) => void }) => {
  const [selectedRows, setSelectedRows] = useState<SelectNotification[]>([]);
  const rowSelection: TableProps<SelectNotification>['rowSelection'] = {
    onChange: (selectedRowKeys: React.Key[], selectedRows: SelectNotification[]) => {
      setSelectedRows(selectedRows);
    },
    getCheckboxProps: (record: SelectNotification) => ({
      disabled: false,
      name: record.title,
    }),
  };
  
  const { data: notifications, isLoading, error } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => getUsersNotifications(),
    refetchInterval: 5000,
    staleTime: 5000
  })
  const columns = [
    {
      title: <NotificationCount notifications={notifications || []} />,
      dataIndex: 'title',
      key: 'title',
      render: (text: string, record: SelectNotification) => (
        <>
          {error && <div>{error.message}</div>}
          {isLoading && <div>Loading...</div>}
          {notifications && notifications.length > 0 && (
            <div onClick={() => handleClickNotification(record)} className='flex items-center justify-between'>
              <div className='flex items-center gap-2'>
                <NotificationStatusIcon status={record.read} />
                <div className={record.read ? 'text-gray-500' : 'font-semibold'}>{record.title}</div>
              </div>
              <div className='text-xs text-gray-500'><DistanceToNow date={record.createdAt} /></div>
            </div>
          )}
        </>
      )
    },
    {
      dataIndex: 'actions',
      key: 'actions',
      render: (text: string, record: SelectNotification) => (
        <RowMenu notificationId={record.id} />
      )
    }
  ]

  const clearSelectedRows = () => {
    setSelectedRows([])
  }
  return (
    <>
      <div className='flex flex-col gap-2'>
        <DeleteNotificationsButtons selectedRows={selectedRows} clearSelectedRows={clearSelectedRows} />
        <Table size='small' columns={columns} dataSource={notifications} loading={isLoading} className='cursor-pointer' rowKey='id' rowSelection={{ type: 'checkbox', ...rowSelection}} />
      </div>
    </>
  )
}

export default NotificationTable
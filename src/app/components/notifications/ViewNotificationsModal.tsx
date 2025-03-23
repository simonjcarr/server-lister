'use client'
import { Modal, Splitter } from 'antd';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react'
import { getUsersNotifications, markNotificationAsRead } from '@/app/actions/notifications/crudActions';
import { useState } from 'react';
import DistanceToNow from '@/app/components/utils/DistanceToNow';
import type { SelectNotification } from '@/db/schema';

const ViewNotificationsModal = ({children}: {children: React.ReactNode}) => {
  const [ selectedNotification, setSelectedNotification ] = useState<SelectNotification | null>(null)
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  if(!session?.user) {
    throw new Error('unauthorized')
  }

  const { data: notifications, isLoading, error } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => getUsersNotifications(),
    refetchInterval: 5000
  })

  const mutate = useMutation({
    mutationFn: async () => {
      if (!selectedNotification) return
      return await markNotificationAsRead(selectedNotification?.id || 0)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    }
  })

  const handleClickNotification = (notification: SelectNotification) => {
    setSelectedNotification(notification)
    mutate.mutate()
  }
  return (
    <>
      <div onClick={() => setOpen(true)}>{children}</div>
      <Modal title="Notifications" open={open} onCancel={() => setOpen(false)} width={800} onOk={() => setOpen(false)}>
        {isLoading && <div>Loading...</div>}
        {error && <div>{error.message}</div>}
        {notifications && notifications.length > 0 && (
          <Splitter>
            <Splitter.Panel>
              {notifications.map((notification) => (
                <div key={notification.id} className='pr-2 border-b-1 border-gray-700 pb-2 mr-4' onClick={() => handleClickNotification(notification)}>
                  <div className={notification.read ? 'text-gray-500' : 'font-semibold'}>{notification.title}</div>
                  <div className='text-xs text-gray-500'><DistanceToNow date={notification.createdAt} /></div>
                </div>
              ))}
            </Splitter.Panel>
            <Splitter.Panel>
              {selectedNotification && (
                <div className='px-4'>
                  <h3 className='text-lg font-bold'>{selectedNotification.title}</h3>
                  <div className='text-xs text-gray-500'><DistanceToNow date={selectedNotification.createdAt} /></div>
                  <p className='mt-2'>{selectedNotification.message}</p>
                </div>
              )}
            </Splitter.Panel>
          </Splitter>
        )}
      </Modal>
    </>
  )
}

export default ViewNotificationsModal
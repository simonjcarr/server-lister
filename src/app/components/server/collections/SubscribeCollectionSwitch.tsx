'use client'
import { Switch } from 'antd'
import { MdNotifications } from 'react-icons/md'
import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react';
import { isSubscribedToCollection, subscribeUserToCollection, unsubscribeUserFromCollection } from '@/app/actions/server/serverCollectionActions';
import { useQueryClient } from '@tanstack/react-query'

function SubscribeCollectionSwitch({ collectionId }: { collectionId: number }) {
  const session = useSession()
  const [isSubscribed, setIsSubscribed] = useState<boolean | null>(null);
  const queryClient = useQueryClient();
  
  useEffect(() => {
    const checkSubscription = async () => {
      const isSubscribed = await isSubscribedToCollection(collectionId);
      setIsSubscribed(isSubscribed);
    };
    checkSubscription();
  }, [collectionId]);
  return (
    <>
      <Switch
        checkedChildren="Subscribed"
        unCheckedChildren="Not Subscribed"
        checked={isSubscribed===true}
        value={true}
        onChange={async (checked) => {
          if (checked) {
            await subscribeUserToCollection(collectionId);
            setIsSubscribed(true);
            queryClient.invalidateQueries({ queryKey: ['usersInCollection', collectionId] });
          } else {
            await unsubscribeUserFromCollection(collectionId);  
            setIsSubscribed(false);
            queryClient.invalidateQueries({ queryKey: ['usersInCollection', collectionId] });
          }
        }}
      />
    </>
  )
}

export default SubscribeCollectionSwitch
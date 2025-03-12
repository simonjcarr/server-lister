'use client'
import { Switch } from 'antd'
import { MdNotifications } from 'react-icons/md'
import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react';
import { isSubscribedToCollection, subscribeUserToCollection, unsubscribeUserFromCollection } from '@/app/actions/server/serverCollectionActions';

function SubscribeCollectionSwitch({ collectionId }: { collectionId: number }) {
  const session = useSession()
  const [isSubscribed, setIsSubscribed] = useState<boolean | null>(null);
  useEffect(() => {
    const checkSubscription = async () => {
      const isSubscribed = await isSubscribedToCollection(collectionId);
      setIsSubscribed(isSubscribed);
    };
    checkSubscription();
  }, [collectionId]);
  return (
    <Switch
      checked={!!!isSubscribed}
      onChange={async (checked) => {
        console.log("I am here", checked)
        if (checked) {
          await subscribeUserToCollection(collectionId);
        } else {
          await unsubscribeUserFromCollection(collectionId);
        }
      }}
    />
  )
}

export default SubscribeCollectionSwitch
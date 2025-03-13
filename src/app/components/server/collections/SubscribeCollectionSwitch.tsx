'use client'
import { Switch } from 'antd'
import { isSubscribedToCollection, subscribeUserToCollection, unsubscribeUserFromCollection } from '@/app/actions/server/serverCollectionActions';
import { useQueryClient, useQuery } from '@tanstack/react-query'

function SubscribeCollectionSwitch({ collectionId }: { collectionId: number }) {
  const queryClient = useQueryClient();
  const {isPending, error, data: isSubscribed} = useQuery({
    queryKey: ['isSubscribed', collectionId],
    queryFn: async () => {
      const result = await isSubscribedToCollection(collectionId);
      return result;
    }
  })
  return (
    <>
      {isPending ? (
        <div>Loading...</div>
      ) : error ? (
        <div>Error loading subscription status</div>
      ) : (
        <Switch
          checkedChildren="Subscribed"
          unCheckedChildren="Not Subscribed"
          checked={isSubscribed}
          value={true}
          onChange={async (checked) => {
            if (checked) {
              await subscribeUserToCollection(collectionId);
              queryClient.invalidateQueries({ queryKey: ['usersInCollection', collectionId] });
              queryClient.invalidateQueries({ queryKey: ['isSubscribed', collectionId] });
            } else {
              await unsubscribeUserFromCollection(collectionId);  
              queryClient.invalidateQueries({ queryKey: ['usersInCollection', collectionId] });
              queryClient.invalidateQueries({ queryKey: ['isSubscribed', collectionId] });
            }
          }}
      />
      )}
    </>
  )
}

export default SubscribeCollectionSwitch
'use client'
import { Tooltip, Switch } from 'antd'
import { App } from 'antd'
import { isSubscribedToCollection, subscribeUserToCollection, unsubscribeUserFromCollection } from '@/app/actions/server/serverCollectionActions';
import { useQueryClient, useQuery, useMutation } from '@tanstack/react-query'
import { useCallback, useEffect, useState } from 'react';

interface ActionResult {
  success: boolean;
  message?: string;
  action: 'subscribe' | 'unsubscribe';
}

function SubscribeCollectionSwitch({ collectionId }: { collectionId: number }) {
  const queryClient = useQueryClient();
  const { notification } = App.useApp(); // Use the App context to get notification API
  const [isChanging, setIsChanging] = useState(false);
  const [actionResult, setActionResult] = useState<ActionResult | null>(null);

  const { isPending, error, data: isSubscribed } = useQuery({
    queryKey: ['isSubscribed', collectionId],
    queryFn: async () => {
      const result = await isSubscribedToCollection(collectionId);
      return result;
    }
  });

  // Create stable callbacks for notifications
  const showSuccessNotification = useCallback((message: string) => {
    notification.success({
      message: actionResult?.action === 'subscribe' ? 'Subscribed' : 'Unsubscribed',
      description: message,
      duration: 3,
    });
  }, [notification, actionResult]);

  const showErrorNotification = useCallback((message: string) => {
    notification.error({
      message: 'Error',
      description: message,
      duration: 3,
    });
  }, [notification]);

  // Handle notifications in an effect using stable callbacks
  useEffect(() => {
    if (actionResult) {
      if (actionResult.success) {
        showSuccessNotification(
          actionResult.action === 'subscribe'
            ? 'You are now subscribed to this collection'
            : 'You are no longer subscribed to this collection'
        );
        
        // Invalidate related queries
        queryClient.invalidateQueries({ queryKey: ['usersInCollection', collectionId] });
        queryClient.invalidateQueries({ queryKey: ['isSubscribed', collectionId] });
      } else {
        showErrorNotification(
          actionResult.action === 'subscribe'
            ? 'Failed to subscribe to this collection'
            : 'Failed to unsubscribe from this collection'
        );
      }
      
      // Reset the result after handling
      setActionResult(null);
      setIsChanging(false);
    }
  }, [actionResult, showSuccessNotification, showErrorNotification, queryClient, collectionId]);

  // Subscribe mutation
  const subscribeMutation = useMutation({
    mutationFn: async () => {
      return await subscribeUserToCollection(collectionId);
    },
    onSuccess: () => {
      setActionResult({
        success: true,
        action: 'subscribe'
      });
    },
    onError: (error) => {
      console.error('Error subscribing to collection:', error);
      setActionResult({
        success: false,
        message: 'Failed to subscribe to this collection',
        action: 'subscribe'
      });
    }
  });

  // Unsubscribe mutation
  const unsubscribeMutation = useMutation({
    mutationFn: async () => {
      return await unsubscribeUserFromCollection(collectionId);
    },
    onSuccess: () => {
      setActionResult({
        success: true,
        action: 'unsubscribe'
      });
    },
    onError: (error) => {
      console.error('Error unsubscribing from collection:', error);
      setActionResult({
        success: false,
        message: 'Failed to unsubscribe from this collection',
        action: 'unsubscribe'
      });
    }
  });

  const handleToggleSubscription = (checked: boolean) => {
    setIsChanging(true);
    if (checked) {
      subscribeMutation.mutate();
    } else {
      unsubscribeMutation.mutate();
    }
  };

  if (isPending) {
    return null; // Or a loading indicator if preferred
  }

  if (error) {
    console.error('Error checking subscription status:', error);
    return null; // Or an error indicator if preferred
  }

  return (
    <Tooltip title={isSubscribed ? "Unsubscribe from collection" : "Subscribe to collection"}>
      <Switch
        checkedChildren="Subscribed"
        unCheckedChildren="Subscribe"
        checked={isSubscribed}
        onChange={handleToggleSubscription}
        loading={isChanging}
      />
    </Tooltip>
  );
}

export default SubscribeCollectionSwitch
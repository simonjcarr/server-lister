'use client'
import { App, Button, Card, Empty, Table } from 'antd'
import React, { useCallback, useEffect, useState } from 'react'
import { getServerCollection, getServersInCollection, removeServerFromCollection } from '@/app/actions/server/serverCollectionActions';
import { MdDelete, MdEdit } from 'react-icons/md';
import { ColumnsType } from 'antd/es/table';
import type { SelectCollection } from '@/db/schema';
import { getServerById } from '@/app/actions/server/crudActions';
import SubscribeCollectionSwitch from './SubscribeCollectionSwitch';
import CollectionSubscribedUsers from './CollectionSubscribedUsers';
import AddServersToCollection from './AddServersToCollection';
import FormEditCollection from './FormEditCollection';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import Link from 'next/link';

interface ServerListItem {
  id: number;
  hostname: string;
  ipv4: string | null;
  description: string | null;
}

interface RemoveResult {
  success: boolean;
  hostname: string;
}

function CollectionServerList({ collectionId }: { collectionId: number }) {
  const queryClient = useQueryClient();
  const { notification: api, notification } = App.useApp();
  
  // Using a ref for storing notification config to avoid calling during render
  const notificationConfig = React.useRef<{
    type: 'success' | 'error';
    message: string;
    description: string;
  } | null>(null);
  const [removeServerResult, setRemoveServerResult] = useState<RemoveResult | null>(null);
  
  // Instead of using callbacks that directly call notifications,
  // simply pass the notification data to the effect
  
  // First effect to update notification config but not trigger API calls during render
  useEffect(() => {
    if (removeServerResult) {
      if (removeServerResult.success) {
        notificationConfig.current = {
          type: 'success',
          message: 'Server Removed',
          description: `Server ${removeServerResult.hostname} has been removed from the collection`
        };
      } else {
        notificationConfig.current = {
          type: 'error',
          message: 'Error',
          description: 'Failed to remove server from collection'
        };
      }
      setRemoveServerResult(null);
    }
  }, [removeServerResult]);
  
  // Second effect to handle the actual notification API calls
  useEffect(() => {
    if (notificationConfig.current) {
      const { type, message, description } = notificationConfig.current;
      if (type === 'success') {
        notification.success({
          message,
          description,
          duration: 3,
        });
      } else {
        notification.error({
          message,
          description,
          duration: 3,
        });
      }
      notificationConfig.current = null;
    }
  }, [notification, removeServerResult]);
  
  // Fetch collection details
  const collectionQuery = useQuery({
    queryKey: ['collection', collectionId],
    queryFn: async () => {
      const result = await getServerCollection(collectionId);
      return result && result.length > 0 ? result[0] : null;
    }
  });
  
  // Fetch servers in the collection with staleTime: 0 to ensure fresh data
  const serversQuery = useQuery({
    queryKey: ['collection-servers', collectionId],
    queryFn: async () => {
      const servers = await getServersInCollection(collectionId);
      return servers.map(server => ({ ...server, key: server.id }));
    },
    staleTime: 0, // Always consider data stale to force re-fetch
    refetchOnMount: true, // Always refetch when component mounts
    refetchOnWindowFocus: true // Refetch when window regains focus
  });
  
  // Mutation for removing a server from the collection
  const removeServerMutation = useMutation({
    mutationFn: async ({ serverId }: { serverId: number }) => {
      const serverToRemove = await getServerById(serverId);
      if (!serverToRemove) {
        throw new Error(`Server with id ${serverId} not found`);
      }
      
      return {
        result: await removeServerFromCollection(serverId, collectionId),
        hostname: serverToRemove.hostname
      };
    },
    onSuccess: (data) => {
      // Instead of showing notification directly, set state to trigger the effect
      setRemoveServerResult({
        success: data.result.success,
        hostname: data.hostname
      });
      
      // Invalidate and refetch all related queries
      queryClient.invalidateQueries({ queryKey: ['collection-servers', collectionId] });
      
      // Also invalidate all server queries
      queryClient.invalidateQueries({ queryKey: ['servers'] });
      
      // Force immediate refetch of filtered server views
      queryClient.refetchQueries({ queryKey: ['servers'] });
      
      // Also invalidate the collection options
      queryClient.invalidateQueries({ queryKey: ['collectionOptions'] });
      queryClient.invalidateQueries({ queryKey: ['collections'] });
    },
    onError: (error) => {
      console.error('Error removing server from collection:', error);
      setRemoveServerResult({
        success: false,
        hostname: ''
      });
    }
  });

  const handleRemoveServerFromList = async (serverId: number) => {
    if (confirm('Are you sure you want to remove this server from the collection?')) {
      removeServerMutation.mutate({ serverId });
    }
  };

  const columns: ColumnsType<ServerListItem> = [
    {
      title: 'Hostname',
      dataIndex: 'hostname',
      sorter: (a, b) => a.hostname.localeCompare(b.hostname),
      sortDirections: ['ascend', 'descend'],
      defaultSortOrder: 'ascend',
      render: (text, record) => (
        <Link href={`/server/view/${record.id}`}>{text}</Link>
      ),
    },
    {
      title: 'IP',
      dataIndex: 'ipv4',
      render: (text) => text || '-',
    },
    {
      title: 'Description',
      dataIndex: 'description',
      render: (text) => text || '-',
    },
    {
      title: 'Action',
      key: 'action',
      width: 80,
      render: (_, record) => (
        <Button 
          danger 
          size='small' 
          icon={<MdDelete />} 
          title="Remove from collection"
          onClick={() => handleRemoveServerFromList(record.id)} 
        />
      ),
    }
  ];

  // Loading or error states
  if (collectionQuery.isPending || serversQuery.isPending) {
    return <div>Loading...</div>;
  }

  if (collectionQuery.error || serversQuery.error) {
    return <div>Error loading collection data</div>;
  }

  const collection = collectionQuery.data;
  if (!collection) {
    return <div>Collection not found</div>;
  }

  return (
    <div className='flex flex-col gap-4'>
      <Card 
        title={
          <div className="flex justify-between items-center">
            <span>{collection.name}</span>
            <div className="flex items-center gap-2">
              <FormEditCollection collection={collection}>
                <Button 
                  size="small" 
                  icon={<MdEdit />} 
                  title="Edit collection"
                >
                  Edit
                </Button>
              </FormEditCollection>
              <SubscribeCollectionSwitch collectionId={collectionId} />
            </div>
          </div>
        }
      >
        <p className='text-gray-500 mb-4'>{collection.description || "No description provided."}</p>
        
        <div className='flex flex-col gap-4'>
          <Card 
            title="Servers" 
            extra={<AddServersToCollection collection={collection} />}
            styles={{ 
              body: { 
                padding: serversQuery.data?.length ? undefined : 0 
              } 
            }}
          >
            {serversQuery.data?.length ? (
              <Table 
                columns={columns} 
                dataSource={serversQuery.data} 
                size='small'
                pagination={{ 
                  pageSize: 10,
                  hideOnSinglePage: serversQuery.data.length <= 10,
                }}
                className="collections-table" 
              />
            ) : (
              <Empty 
                description="No servers in this collection" 
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            )}
          </Card>
          
          <CollectionSubscribedUsers collectionId={collectionId} />
        </div>
      </Card>
    </div>
  );
}

export default CollectionServerList;
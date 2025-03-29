// Client-side component for rendering collections
'use client'
import { Button, Card, Popconfirm, Space, Table, TableColumnsType, App, Tooltip, Segmented } from 'antd';
import React, { useState } from 'react';
import { useQueryClient, useQuery, useMutation } from '@tanstack/react-query';

// Import the server actions
import { deleteCollection } from '@/app/actions/server/collectionActions';
import { getServerCollectionsWithSubscription, CollectionWithSubscription } from '@/app/actions/server/collectionSubscriptionActions';
import { subscribeUserToCollection, unsubscribeUserFromCollection } from '@/app/actions/server/serverCollectionActions';
import CollectionServerList from './CollectionServerList';
import FormAddCollection from './FormAddCollection';
import FormEditCollection from './FormEditCollection';
import { MdAdd, MdDelete, MdEdit } from 'react-icons/md';
import { HeartFilled, HeartOutlined, FilterOutlined } from '@ant-design/icons';
import { SelectCollection } from '@/db/schema';

interface DataType extends CollectionWithSubscription {
  key: React.Key;
}

function ListCollections() {
  const queryClient = useQueryClient();
  const [selectedCollectionId, setSelectedCollectionId] = useState<number | null>(null);
  const [showSubscribedOnly, setShowSubscribedOnly] = useState<boolean>(false);
  const { notification } = App.useApp();
  // Using a ref for storing notification config to avoid calling during render
  const notificationConfig = React.useRef<{
    type: 'success' | 'error';
    message: string;
    description: string;
  } | null>(null);
  
  // Call the server action directly via React Query
  const { isPending, error, data } = useQuery({
    queryKey: ['collections-with-subscription'],
    queryFn: async () => {
      return await getServerCollectionsWithSubscription();
    }
  });
  
  // Mutation for deleting a collection
  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteCollection(id),
    onSuccess: (data) => {
      if (data.success) {
        // Store the notification config to show in effect
        notificationConfig.current = {
          type: 'success',
          message: 'Success',
          description: 'Collection deleted successfully'
        };
        
        // If the deleted collection was selected, reset the selection
        if (selectedCollectionId === data.id) {
          setSelectedCollectionId(null);
        }
        
        // Invalidate and refetch collections
        queryClient.invalidateQueries({ queryKey: ['collections-with-subscription'] });
      } else {
        // Store the notification config to show in effect
        notificationConfig.current = {
          type: 'error',
          message: 'Error',
          description: data.message || 'Failed to delete collection'
        };
      }
    },
    onError: (error) => {
      console.error('Error deleting collection:', error);
      // Store the notification config to show in effect
      notificationConfig.current = {
        type: 'error',
        message: 'Error',
        description: 'An unexpected error occurred'
      };
    }
  });

  // Mutation for subscribing to a collection
  const subscribeMutation = useMutation({
    mutationFn: (collectionId: number) => subscribeUserToCollection(collectionId),
    onSuccess: (_, collectionId) => {
      // Invalidate both the collections list and the individual collection subscription status
      queryClient.invalidateQueries({ queryKey: ['collections-with-subscription'] });
      queryClient.invalidateQueries({ queryKey: ['isSubscribed', collectionId] });
    },
    onError: (error) => {
      console.error('Error subscribing to collection:', error);
      notification.error({
        message: 'Error',
        description: 'Failed to subscribe to collection'
      });
    }
  });

  // Mutation for unsubscribing from a collection
  const unsubscribeMutation = useMutation({
    mutationFn: (collectionId: number) => unsubscribeUserFromCollection(collectionId),
    onSuccess: (_, collectionId) => {
      // Invalidate both the collections list and the individual collection subscription status
      queryClient.invalidateQueries({ queryKey: ['collections-with-subscription'] });
      queryClient.invalidateQueries({ queryKey: ['isSubscribed', collectionId] });
    },
    onError: (error) => {
      console.error('Error unsubscribing from collection:', error);
      notification.error({
        message: 'Error',
        description: 'Failed to unsubscribe from collection'
      });
    }
  });
  
  // Effect for showing notifications to avoid calling during render
  React.useEffect(() => {
    if (notificationConfig.current) {
      const { type, message: msg, description } = notificationConfig.current;
      if (type === 'success') {
        notification.success({
          message: msg,
          description,
          duration: 3,
        });
      } else {
        notification.error({
          message: msg,
          description,
          duration: 3,
        });
      }
      notificationConfig.current = null;
    }
  }, [notification, deleteMutation.isSuccess, deleteMutation.isError]);

  const handleRowClick = (record: DataType) => {
    setSelectedCollectionId(record.id);
  };

  const handleDeleteCollection = (id: number) => {
    deleteMutation.mutate(id);
  };

  const handleToggleSubscription = (collectionId: number, isSubscribed: boolean) => {
    if (isSubscribed) {
      unsubscribeMutation.mutate(collectionId);
    } else {
      subscribeMutation.mutate(collectionId);
    }
  };

  const columns: TableColumnsType<DataType> = [
    {
      title: '',
      key: 'subscription',
      width: 50,
      render: (_, record) => (
        <Tooltip title={record.isSubscribed ? "Unsubscribe" : "Subscribe"}>
          <Button
            type="text"
            icon={record.isSubscribed ? 
              <HeartFilled style={{ color: '#FFD700' }} /> : 
              <HeartOutlined style={{ color: '#d9d9d9' }} />
            }
            onClick={(e) => {
              e.stopPropagation();
              handleToggleSubscription(record.id, record.isSubscribed);
            }}
          />
        </Tooltip>
      ),
    },
    {
      title: 'Name',
      dataIndex: 'name',
      sorter: (a, b) => a.name.localeCompare(b.name),
      sortDirections: ['ascend', 'descend'],
      defaultSortOrder: 'ascend',
      render: (value: string, record: DataType) => (
        <a onClick={() => handleRowClick(record)}>{record.name}</a>
      )
    },
    {
      title: 'Action',
      key: 'action',
      width: 100,
      render: (_, record) => (
        <Space size="small">
          <FormEditCollection collection={record as SelectCollection}>
            <Button
              size="small"
              type="text"
              icon={<MdEdit />}
              title="Edit collection"
            />
          </FormEditCollection>
          <Popconfirm
            title="Delete Collection"
            description="Are you sure you want to delete this collection? This action cannot be undone."
            onConfirm={() => handleDeleteCollection(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button
              size="small"
              type="text"
              danger
              icon={<MdDelete />}
              title="Delete collection"
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // Filter collections based on subscription status if filter is enabled
  const filteredData = data?.filter(collection => 
    !showSubscribedOnly || collection.isSubscribed
  );

  return (
    <Card 
      title="Server Collections" 
      extra={
        <Space>
          <FormAddCollection>
            <Button type="primary" icon={<MdAdd />}>
              Add Collection
            </Button>
          </FormAddCollection>
        </Space>
      }
    >
      {isPending ? (
        <div>Loading...</div>
      ) : error ? (
        <div>Error loading collections</div>
      ) : (
        <div className='grid grid-cols-12 gap-4'>
          <div className='col col-span-4'>
            <div className="mb-4">
              <Segmented
                options={[
                  {
                    label: (
                      <div className="flex items-center">
                        <FilterOutlined className="mr-1" />
                        <span>All Collections</span>
                      </div>
                    ),
                    value: 'all',
                  },
                  {
                    label: (
                      <div className="flex items-center">
                        <HeartFilled className="mr-1" style={{ color: '#FFD700' }} />
                        <span>Subscribed Only</span>
                      </div>
                    ),
                    value: 'subscribed',
                  },
                ]}
                value={showSubscribedOnly ? 'subscribed' : 'all'}
                onChange={(value) => setShowSubscribedOnly(value === 'subscribed')}
                block
              />
            </div>
            <Table 
              columns={columns} 
              dataSource={filteredData?.map(collection => ({ 
                ...collection, 
                key: collection.id 
              }))} 
              size='small'
              pagination={{ pageSize: 10 }}
              rowClassName={(record) => record.id === selectedCollectionId ? 'bg-gray-800' : ''}
              onRow={(record) => ({
                onClick: () => handleRowClick(record),
              })}
              className="collections-table"
            />
          </div>
          <div className='col col-span-8'>
            {selectedCollectionId && <CollectionServerList collectionId={selectedCollectionId} />}
          </div>
        </div>
      )}
    </Card>
  );
}

export default ListCollections;

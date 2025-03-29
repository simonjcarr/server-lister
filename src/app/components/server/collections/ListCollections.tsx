// Client-side component for rendering collections
'use client'
import { Button, Card, Popconfirm, Space, Table, TableColumnsType, App } from 'antd';
import React, { useState } from 'react';
import { useQueryClient, useQuery, useMutation } from '@tanstack/react-query';

// Import the server actions
import { getServerCollections } from '@/app/actions/server/serverCollectionActions';
import { deleteCollection } from '@/app/actions/server/collectionActions';
import CollectionServerList from './CollectionServerList';
import FormAddCollection from './FormAddCollection';
import FormEditCollection from './FormEditCollection';
import { MdAdd, MdDelete, MdEdit } from 'react-icons/md';
import { SelectCollection } from '@/db/schema';

interface ServerCollection {
  id: number;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

interface DataType {
  key: React.Key;
  name: string;
  id: number;
  description: string | null;
}

function ListCollections() {
  const queryClient = useQueryClient();
  const [selectedCollectionId, setSelectedCollectionId] = useState<number | null>(null);
  const { notification } = App.useApp();
  
  // Call the server action directly via React Query
  const { isPending, error, data } = useQuery({
    queryKey: ['collections'],
    queryFn: async () => {
      const result = await getServerCollections();
      return result;
    }
  });
  
  // Mutation for deleting a collection
  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteCollection(id),
    onSuccess: (data) => {
      if (data.success) {
        notification.success({
          message: 'Success',
          description: 'Collection deleted successfully',
          duration: 3,
        });
        
        // If the deleted collection was selected, reset the selection
        if (selectedCollectionId === data.id) {
          setSelectedCollectionId(null);
        }
        
        // Invalidate and refetch collections
        queryClient.invalidateQueries({ queryKey: ['collections'] });
      } else {
        notification.error({
          message: 'Error',
          description: data.message || 'Failed to delete collection',
          duration: 3,
        });
      }
    },
    onError: (error) => {
      console.error('Error deleting collection:', error);
      notification.error({
        message: 'Error',
        description: 'An unexpected error occurred',
        duration: 3,
      });
    }
  });

  const handleRowClick = (record: DataType) => {
    setSelectedCollectionId(record.id);
  }

  const handleDeleteCollection = (id: number) => {
    deleteMutation.mutate(id);
  }

  const columns: TableColumnsType<DataType> = [
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

  return (
    <Card 
      title="Server Collections" 
      extra={
        <FormAddCollection>
          <Button type="primary" icon={<MdAdd />}>
            Add Collection
          </Button>
        </FormAddCollection>
      }
    >
      {isPending ? (
        <div>Loading...</div>
      ) : error ? (
        <div>Error loading collections</div>
      ) : (
        <div className='grid grid-cols-12 gap-4'>
          <div className='col col-span-4'>
            <Table 
              columns={columns} 
              dataSource={data?.map(collection => ({ 
                ...collection, 
                key: collection.id 
              }))} 
              size='small'
              pagination={{ pageSize: 10 }}
              rowClassName={(record) => record.id === selectedCollectionId ? 'bg-blue-50' : ''}
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

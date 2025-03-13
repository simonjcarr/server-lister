// Client-side component for rendering collections
'use client'
import { Card, Table, TableColumnsType } from 'antd';
import React, { useState } from 'react';
import { useQueryClient, useQuery } from '@tanstack/react-query';

// Import the server action
import { getServerCollections } from '@/app/actions/server/serverCollectionActions';
import CollectionServerList from './CollectionServerList';

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
}

function ListCollections() {
  const queryClient = useQueryClient();
  // const [collectionData, setCollectionData] = useState<ServerCollection[]>([]);
  const [selectedCollectionId, setSelectedCollectionId] = useState<number | null>(null);
  // Call the server action directly via React Query
  const {isPending, error, data} = useQuery({
    queryKey: ['collections'],
    queryFn: async () => {
      const result = await getServerCollections();
      return result;
    }
  });
  
  // const dataSource = collectionData.map((collection: ServerCollection) => ({
  //   ...collection,
  //   key: collection.id,
  // }));

  const handleRowClick = (record: DataType) => {
    setSelectedCollectionId(record.key as number);
    console.log('Row clicked:', record)
  }

  const columns: TableColumnsType<DataType> = [
    {
      title: 'Name',
      dataIndex: 'name',
      sorter: (a, b) => a.name.localeCompare(b.name),
      sortDirections: ['ascend', 'descend'],
      defaultSortOrder: 'ascend',
      render: (value: string, record: DataType, index: number) => (
        <a onClick={() => handleRowClick(record)}>{record.name}</a>
      )
    }
  ];

  return (
    <Card title="Collections">
      {isPending ? (
        <div>Loading...</div>
      ) : error ? (
        <div>Error loading collections</div>
      ) : (
        <div className='grid grid-cols-12 gap-4'>
          <div className='col col-span-4'>
            <Table columns={columns} dataSource={data?.map(collection => ({ ...collection, key: collection.id }))} size='small'/>
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
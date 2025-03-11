// Client-side component for rendering collections
'use client'
import { Card, Table, TableColumnsType } from 'antd';
import React, { useState } from 'react';
import { useQueryClient, useQuery } from '@tanstack/react-query';

// Import the server action
import { getServerCollections } from '@/app/actions/server/serverCollectionActions';

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
  const [collectionData, setCollectionData] = useState<ServerCollection[]>([]);
  
  // Call the server action directly via React Query
  const query = useQuery({
    queryKey: ['collections'],
    queryFn: async () => {
      const result = await getServerCollections();
      setCollectionData(result);
      return result;
    }
  });
  
  const dataSource = collectionData.map((collection: ServerCollection) => ({
    key: collection.id,
    name: collection.name
  }));

  const handleRowClick = (record: DataType) => {
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
    <Card title="Server Groups">
      {query.isLoading ? (
        <div>Loading...</div>
      ) : query.isError ? (
        <div>Error loading collections</div>
      ) : (
        <div>
          <Table columns={columns} dataSource={dataSource} />
          {collectionData.length > 0 && <div>{collectionData[0].name}</div>}
        </div>
      )}
    </Card>
  );
}

export default ListCollections;
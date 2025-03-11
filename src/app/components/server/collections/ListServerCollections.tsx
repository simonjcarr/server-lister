// Client-side component for rendering collections
'use client';

import { Card, Table, TableColumnsType } from 'antd';
import React from 'react';

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

function ListServerCollections({ collections }: { collections: ServerCollection[] }) {
  const dataSource = collections.map((collection) => ({
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
        <a  onClick={() => handleRowClick(record)}>{record.name}</a>
      )
    }
  ];

  return (
    <Card title="Server Groups">
      <Table columns={columns} dataSource={dataSource} />
    </Card>
  );
}

export default ListServerCollections;
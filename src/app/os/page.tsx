'use client'
import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { getOSs } from '@/app/actions/os/crudActions'
import { Card, Table } from 'antd'
const Page = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['oss'],
    queryFn: getOSs,
  });
  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Version',
      dataIndex: 'version',
      key: 'version',
    },
    {
      title: 'EOL Date',
      dataIndex: 'EOLDate',
      key: 'EOLDate',
    },
    {
      title: 'Patch Version',
      dataIndex: 'latestPatchVersion',
      key: 'latestPatchVersion',
    }
  ]
  return (
    <div>
      <Card title="OS List">
        {isLoading && <p>Loading...</p>}
        {error && <p>Error: {error.message}</p>}
        {data && (
          <Table columns={columns} dataSource={data} rowKey="id" />
        )}
      </Card>
    </div>
  )
}

export default Page
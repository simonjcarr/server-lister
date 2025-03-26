'use client'
import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { getOSs, type OSWithPatchVersion } from '@/app/actions/os/crudActions'
import { Button, Card, Table } from 'antd'
import FormEditOS from '../components/os/FormEditOS'
import { CalendarOutlined } from '@ant-design/icons'
const Page = () => {
  const { data, isLoading, error } = useQuery<OSWithPatchVersion[]>({
    queryKey: ['oss'],
    queryFn: () => getOSs(),
  });
  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      sorter: (a: OSWithPatchVersion, b: OSWithPatchVersion) => a.name.localeCompare(b.name),
    },
    {
      title: 'Version',
      dataIndex: 'version',
      key: 'version',
    },
    {
      title: (<div className='flex items-center gap-2'><CalendarOutlined /> EOL Date</div>),
      dataIndex: 'EOLDate',
      key: 'EOLDate',
      render: (text: string) => new Date(text).toLocaleDateString(),
      sorter: (a: OSWithPatchVersion, b: OSWithPatchVersion) => new Date(a.EOLDate).getTime() - new Date(b.EOLDate).getTime(),
    },
    {
      title: 'Patch Version',
      dataIndex: 'latestPatchVersion',
      key: 'latestPatchVersion',
    },
    {
      title: 'Actions',
      dataIndex: 'id',
      key: 'id',
      render: (text: string, record: OSWithPatchVersion) => (
        <FormEditOS id={record.id}>
          <Button type="link">Edit</Button>
        </FormEditOS>
      ),
    }
  ]
  return (
    <div>
      <Card title="OS List">
        {isLoading && <p>Loading...</p>}
        {error && <p>Error: {error.message}</p>}
        {data && (
          <Table 
            columns={columns} 
            dataSource={data} 
            rowKey="id" 
          />
        )}
      </Card>
    </div>
  )
}

export default Page
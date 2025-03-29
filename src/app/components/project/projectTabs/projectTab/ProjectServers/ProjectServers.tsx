'use client'

import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { getServers } from '@/app/actions/server/crudActions'
import { Table, Card, Tag, Space, Button } from 'antd'
import { useRouter } from 'next/navigation'
import { CloudServerOutlined} from '@ant-design/icons'
import ClickToCopy from '@/app/components/utils/ClickToCopy'
import type { ColumnsType } from 'antd/es/table'

interface ProjectServersProps {
  projectId: number
}

// Define type for the data we actually receive from the API
type ServerListItem = {
  id: number
  hostname: string
  ipv4: string | null
  ipv6: string | null
  description: string | null
  docLink: string | null
  itar: boolean
  secureServer: boolean
  projectId: number | null
  projectName: string | null
  businessId: number | null
  businessName: string | null
  osId: number | null
  osName: string | null
  locationId: number | null
  locationName: string | null
  createdAt: Date
  updatedAt: Date
}

const ProjectServers: React.FC<ProjectServersProps> = ({ projectId }) => {
  const router = useRouter()

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['project-servers', projectId],
    queryFn: () => getServers({ projectId }, { field: 'hostname', direction: 'asc' }, { page: 1, pageSize: 10 }),
    enabled: !!projectId,
    staleTime: 60 * 1000 // 1 minute
  })

  // Define columns with proper typing
  const columns: ColumnsType<ServerListItem> = [
    {
      title: 'Hostname',
      dataIndex: 'hostname',
      key: 'hostname',
      render: (_: unknown, record: ServerListItem) => (
        <ClickToCopy text={record.hostname ?? ''} />
      ),
    },
    {
      title: 'IPv4',
      dataIndex: 'ipv4',
      key: 'ipv4',
      render: (_: unknown, record: ServerListItem) => (
        <ClickToCopy text={record.ipv4 ?? ''} />
      ),
    },
    {
      title: 'OS',
      dataIndex: 'osName',
      key: 'osName',
    },
    {
      title: 'Location',
      dataIndex: 'locationName',
      key: 'locationName',
    },
    {
      title: 'Security',
      key: 'security',
      render: (_: unknown, record: ServerListItem) => (
        <Space>
          {record.itar === true && <Tag color="red">ITAR</Tag>}
          {record.secureServer === true && <Tag color="green">Secure</Tag>}
        </Space>
      ),
    },
  ]

  return (
    <Card 
      title={
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <CloudServerOutlined />
            <span>Project Servers</span>
          </div>
        </div>
      }
      size="small"
      extra={
        <Button 
          size="small" 
          onClick={() => refetch()}
        >
          Refresh
        </Button>
      }
    >
      {error && <div className="text-red-500">Error loading servers: {(error as Error).message}</div>}
      
      <Table
        rowKey="id"
        // Use type assertion here since we know the actual structure
        dataSource={data?.data as ServerListItem[]}
        columns={columns}
        loading={isLoading}
        pagination={{
          pageSize: 5,
          hideOnSinglePage: true,
          showSizeChanger: false,
        }}
        size="small"
        onRow={(record) => ({
          onClick: () => {
            router.push(`/server/view/${record.id}`)
          },
          className: 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700'
        })}
        locale={{
          emptyText: 'No servers assigned to this project'
        }}
      />
    </Card>
  )
}

export default ProjectServers

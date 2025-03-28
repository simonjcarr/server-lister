'use client'
import { Card, Table } from 'antd'
import { useQuery } from '@tanstack/react-query'
import { getPrimaryProjectEngineers } from '@/app/actions/projects/crudActions'

const PrimaryEngineerList = ({ projectId }: { projectId: number }) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ["primaryProjectEngineers", "list", projectId],
    queryFn: () => getPrimaryProjectEngineers(projectId),
    enabled: !!projectId,
    staleTime: 60 * 1000
  })
  const columns = [
    { 
      title: 'Name', 
      dataIndex: 'name', 
      key: 'name' 
    },
    { 
      title: 'Email', 
      dataIndex: 'email', 
      key: 'email' 
    },
  ]
  return (
    <Card title="Primary engineers">
      {isLoading && <p>Loading...</p>}
      {error && <p>Error: {error.message}</p>}
      {data &&
        <Table
          size="small"
          rowKey="id"
          columns={columns}
          dataSource={data}
        />}
    </Card>
  )
}

export default PrimaryEngineerList
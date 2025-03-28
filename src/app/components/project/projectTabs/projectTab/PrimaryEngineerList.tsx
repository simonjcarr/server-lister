'use client'
import { Card, Table } from 'antd'
import { useQuery } from '@tanstack/react-query'
import { getPrimaryProjectEngineers } from '@/app/actions/projects/crudActions'

const PrimaryEngineerList = ({ projectId }: { projectId: number }) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['primaryProjectEngineers', projectId],
    queryFn: () => getPrimaryProjectEngineers(projectId),
    enabled: !!projectId,
    staleTime: 60 * 1000
  })
  return (
    <Card title="Primary engineers">
      {isLoading && <p>Loading...</p>}
      {error && <p>Error: {error.message}</p>}
      {data && <Table
        size="small"
        rowKey="id"
        columns={[
          { title: 'Name', dataIndex: 'name', key: 'name' },
          { title: 'Email', dataIndex: 'email', key: 'email' },
        ]}
        dataSource={data}
      />}
    </Card>
  )
}

export default PrimaryEngineerList
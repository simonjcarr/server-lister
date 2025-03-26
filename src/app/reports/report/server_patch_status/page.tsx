'use client'
import { useQuery } from '@tanstack/react-query'
import { getRawPatchStatus } from '@/app/actions/reports/patchStatus'
import { Table } from 'antd'
const Page = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['patchStatus'],
    queryFn: getRawPatchStatus
  })
  const columns = [
    {
      title: 'Server ID',
      dataIndex: 'server_id',
      key: 'server_id',
    },
    {
      title: 'Hostname',
      dataIndex: 'hostname',
      key: 'hostname',
    },
    {
      title: 'OS',
      dataIndex: 'os_name',
      key: 'os_name',
    },
    {
      title: 'Current Scanned Patch',
      dataIndex: 'current_scanned_patch',
      key: 'current_scanned_patch',
    },
    {
      title: 'Latest Available Patch',
      dataIndex: 'latest_available_patch',
      key: 'latest_available_patch',
    },
    {
      title: 'Patch Status',
      dataIndex: 'patch_status',
      key: 'patch_status',
    },
    {
      title: 'Days Behind',
      dataIndex: 'days_behind',
      key: 'days_behind',
    },
  ]
  return (
    <div>
      {isLoading && <div>Loading...</div>}
      {error && <div>Error: {error.message}</div>}
        {data && <Table columns={columns} dataSource={data} size="small" rowKey="server_id" />}
    </div>
  )
}

export default Page
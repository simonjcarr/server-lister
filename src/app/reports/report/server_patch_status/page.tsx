'use client'
import { useQuery } from '@tanstack/react-query'
import { getRawPatchStatus } from '@/app/actions/reports/patchStatus'
import { Table } from 'antd'
import { PatchStatus } from '@/app/types/reports'

const Page = () => {
  const { data, isLoading, error } = useQuery<PatchStatus[]>({
    queryKey: ['report', 'server_patch_status'],
    queryFn: () => getRawPatchStatus(),
    staleTime: 1000 * 60 * 5 // 5 minutes
  })

const formatDaysBehind = (record: PatchStatus) => {
  if(record.patch_status === 'No Scan Data') {
    return "N/A"
  }
  return record.days_behind.toString()
}
  
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
      render: (text: number, record: PatchStatus) => formatDaysBehind(record),
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
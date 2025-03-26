'use client'
import { useQuery } from '@tanstack/react-query'
import { getRawPatchStatus } from '@/app/actions/reports/patchStatus'
import { Table } from 'antd'
import type { TableProps } from 'antd';
import { PatchStatus } from '@/app/types/reports' 
import DownloadCSV from '@/app/components/reports/DownloadCSV'


type FetchedPatchStatus = Omit<PatchStatus, 'server_id'>;


const Page = () => {
  const { data, isLoading, error } = useQuery<FetchedPatchStatus[]>({ 
    queryKey: ['report', 'server_patch_status'],
    queryFn: () => getRawPatchStatus(), 
    staleTime: 1000 * 60 * 5
  });

  const formatDaysBehind = (record: FetchedPatchStatus): string => {
    if (record.patch_status === 'No Scan Data') {
      return "N/A";
    }
    return record.days_behind?.toString() ?? "N/A";
  };

  const columns: TableProps<FetchedPatchStatus>['columns'] = [ 
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
      render: (_text, record) => formatDaysBehind(record),
      key: 'days_behind',
    },
  ];

  const rowKey = 'hostname';

  return (
    <div>
      <Table
        loading={isLoading}
        columns={columns}
        dataSource={data} 
        size="small"
        rowKey={rowKey}
      />

      {error && <div style={{ color: 'red', marginTop: '10px' }}>Error: {error.message}</div>}
      {data && !error && (
        <div style={{ marginTop: '16px' }}>
          <DownloadCSV data={data}>
            Download CSV
          </DownloadCSV>
        </div>
      )}
    </div>
  );
}

export default Page;
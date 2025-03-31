'use client'
import { useQuery } from '@tanstack/react-query'
import { getBookingCodeStatusReport } from '@/app/actions/reports/bookingCodes'
import { Table, Tag, Space, Button } from 'antd'
import type { TableProps } from 'antd';
import { BookingCodeStatusReportItem } from '@/app/types/reports/bookingCodes'
import DownloadCSV from '@/app/components/reports/DownloadCSV'
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';

const BookingCodeStatusReport = () => {
  const router = useRouter();
  const { data, isLoading, error } = useQuery<BookingCodeStatusReportItem[]>({ 
    queryKey: ['report', 'booking_code_status'],
    queryFn: getBookingCodeStatusReport, 
    staleTime: 1000 * 60 * 5 // 5 minutes
  });

  const getStatusTag = (status: string) => {
    switch (status) {
      case 'expired':
        return <Tag color="red">Expired</Tag>;
      case 'expiring_soon':
        return <Tag color="orange">Expiring Soon</Tag>;
      case 'no_codes':
        return <Tag color="blue">No Codes</Tag>;
      default:
        return <Tag>{status}</Tag>;
    }
  };

  const formatDate = (date: Date | null) => {
    if (!date) return 'N/A';
    return format(new Date(date), 'yyyy-MM-dd');
  };

  const formatDaysUntil = (days: number | null) => {
    if (days === null) return 'N/A';
    if (days < 0) return `${Math.abs(days)} days ago`;
    return `${days} days`;
  };

  const navigateToBookingCodeGroup = (groupId: number) => {
    // Store the group ID in sessionStorage so BookingCodeGroupsList can read it
    sessionStorage.setItem('expandBookingCodeGroupId', groupId.toString());
    router.push(`/project/booking-codes?tab=groups`);
  };

  const columns: TableProps<BookingCodeStatusReportItem>['columns'] = [ 
    {
      title: 'Group Name',
      dataIndex: 'groupName',
      key: 'groupName',
      render: (text, record) => (
        <a onClick={() => navigateToBookingCodeGroup(record.groupId)}>{text}</a>
      ),
      sorter: (a, b) => a.groupName.localeCompare(b.groupName),
    },
    {
      title: 'Code',
      dataIndex: 'code',
      key: 'code',
      render: (text) => text || 'N/A',
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      render: (text) => text || 'N/A',
    },
    {
      title: 'Valid From',
      dataIndex: 'validFrom',
      key: 'validFrom',
      render: (date) => formatDate(date),
      sorter: (a, b) => {
        if (!a.validFrom && !b.validFrom) return 0;
        if (!a.validFrom) return -1;
        if (!b.validFrom) return 1;
        return new Date(a.validFrom).getTime() - new Date(b.validFrom).getTime();
      },
    },
    {
      title: 'Valid To',
      dataIndex: 'validTo',
      key: 'validTo',
      render: (date) => formatDate(date),
      sorter: (a, b) => {
        if (!a.validTo && !b.validTo) return 0;
        if (!a.validTo) return -1;
        if (!b.validTo) return 1;
        return new Date(a.validTo).getTime() - new Date(b.validTo).getTime();
      },
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => getStatusTag(status),
      filters: [
        { text: 'Expired', value: 'expired' },
        { text: 'Expiring Soon', value: 'expiring_soon' },
        { text: 'No Codes', value: 'no_codes' },
      ],
      onFilter: (value, record) => record.status === value,
    },
    {
      title: 'Days Until Expiration',
      dataIndex: 'daysUntilExpiration',
      key: 'daysUntilExpiration',
      render: (days) => formatDaysUntil(days),
      sorter: (a, b) => {
        if (a.daysUntilExpiration === null && b.daysUntilExpiration === null) return 0;
        if (a.daysUntilExpiration === null) return -1;
        if (b.daysUntilExpiration === null) return 1;
        return a.daysUntilExpiration - b.daysUntilExpiration;
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space size="small">
          <Button 
            type="primary" 
            size="small" 
            onClick={() => navigateToBookingCodeGroup(record.groupId)}
          >
            Manage
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <h1 className="text-xl font-semibold mb-4">Booking Code Status Report</h1>
      <p className="mb-4">This report shows booking code groups that need attention:</p>
      <ul className="list-disc ml-8 mb-4">
        <li>Groups with no booking codes</li>
        <li>Groups with valid codes that will expire within one month</li>
        <li>Groups with only expired codes (showing just the most recently expired code)</li>
      </ul>
      
      <Table
        loading={isLoading}
        columns={columns}
        dataSource={data} 
        rowKey={(record) => `${record.groupId}_${record.codeId || 'nocode'}`}
        pagination={{ pageSize: 15 }}
      />

      {error && <div className="text-red-500 mt-4">Error: {error instanceof Error ? error.message : 'Unknown error'}</div>}
      
      {data && !error && (
        <div className="mt-4">
          <DownloadCSV data={data}>
            Download CSV
          </DownloadCSV>
        </div>
      )}
    </div>
  );
};

export default BookingCodeStatusReport;

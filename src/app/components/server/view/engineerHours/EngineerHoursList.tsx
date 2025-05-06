'use client';

import React from 'react';
import { Table, Button, Typography, Tooltip, message, Popconfirm } from 'antd';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getEngineerHoursByServerId, deleteEngineerHours } from '@/app/actions/server/engineerHours/crudActions';
import { DeleteOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

const { Text } = Typography;

interface EngineerHoursListProps {
  serverId: number;
}

const EngineerHoursList: React.FC<EngineerHoursListProps> = ({ serverId }) => {
  const [messageApi, contextHolder] = message.useMessage();
  const queryClient = useQueryClient();

  // Query to get engineer hours for this server
  const { data, isLoading } = useQuery({
    queryKey: ['engineerHours', serverId],
    queryFn: () => getEngineerHoursByServerId(serverId),
    enabled: !!serverId,
  });

  // Mutation for deleting engineer hours
  const deleteMutation = useMutation({
    mutationFn: deleteEngineerHours,
    onSuccess: (data) => {
      if (data.success) {
        messageApi.success('Record deleted successfully');
        queryClient.invalidateQueries({ queryKey: ['engineerHours', serverId] });
      } else {
        messageApi.error(data.error || 'Failed to delete record');
      }
    },
    onError: (error) => {
      messageApi.error('An error occurred while deleting the record');
      console.error('Error deleting record:', error);
    },
  });

  const handleDelete = async (id: number) => {
    await deleteMutation.mutateAsync(id);
  };

  const columns = [
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      render: (date: string) => dayjs(date).format('YYYY-MM-DD'),
      sorter: (a: { date: string }, b: { date: string }) => dayjs(a.date).unix() - dayjs(b.date).unix(),
    },
    {
      title: 'Booking Code',
      dataIndex: 'bookingCode',
      key: 'bookingCode',
      render: (code: string, record: { bookingCodeDescription?: string }) => (
        <Tooltip title={record.bookingCodeDescription || ''}>
          <Text>{code}</Text>
        </Tooltip>
      ),
    },
    {
      title: 'Minutes',
      dataIndex: 'minutes',
      key: 'minutes',
      sorter: (a: { minutes: number }, b: { minutes: number }) => a.minutes - b.minutes,
    },
    {
      title: 'Note',
      dataIndex: 'note',
      key: 'note',
      ellipsis: true,
      render: (note: string) => (
        note ? (
          <Tooltip title={note}>
            <Text ellipsis style={{ maxWidth: 200 }}>{note}</Text>
          </Tooltip>
        ) : '-'
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: unknown, record: { id: number }) => (
        <Popconfirm
          title="Delete record"
          description="Are you sure you want to delete this record?"
          onConfirm={() => handleDelete(record.id)}
          okText="Yes"
          cancelText="No"
        >
          <Button 
            type="text" 
            danger 
            icon={<DeleteOutlined />} 
            loading={deleteMutation.isPending}
          />
        </Popconfirm>
      ),
    },
  ];

  return (
    <div>
      {contextHolder}
      <Table
        columns={columns}
        dataSource={data?.success ? data.data : []}
        loading={isLoading}
        rowKey="id"
        pagination={{ pageSize: 10 }}
        scroll={{ x: true }}
        locale={{ emptyText: 'No hours logged yet' }}
      />
    </div>
  );
};

export default EngineerHoursList;
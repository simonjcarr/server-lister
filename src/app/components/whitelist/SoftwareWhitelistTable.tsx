'use client';

import { Table, Button, Space, Tag, Spin, Tooltip, Modal, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useRouter } from 'next/navigation';
import { EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import { fetchSoftwareWhitelist, deleteSoftwareWhitelist } from '@/app/actions/whitelist/whitelistActions';
import { SelectSoftwareWhitelist } from '@/db/schema/softwareWhitelist';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export function SoftwareWhitelistTable() {
  // We'll need a custom type for the whitelist items with the OS family name included
  type WhitelistItem = Omit<SelectSoftwareWhitelist, 'versionInfo'> & {
    osFamilyName: string | null;
    versionInfo?: string | null;
  };
  
  const router = useRouter();
  const queryClient = useQueryClient();
  const [messageApi, contextHolder] = message.useMessage();
  
  // Query to fetch the whitelist data
  const { data: whitelistItems, isLoading, error } = useQuery<WhitelistItem[]>({
    queryKey: ['softwareWhitelist'],
    queryFn: fetchSoftwareWhitelist,
  });

  // Mutation for deleting a whitelist item
  const deleteMutation = useMutation({
    mutationFn: deleteSoftwareWhitelist,
    onSuccess: () => {
      messageApi.success('Software whitelist item deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['softwareWhitelist'] });
    },
    onError: (error) => {
      messageApi.error('Failed to delete software whitelist item');
      console.error('Delete error:', error);
    }
  });

  const confirmDelete = (id: number) => {
    Modal.confirm({
      title: 'Are you sure you want to delete this whitelist item?',
      content: 'This will also delete all associated version records.',
      okText: 'Yes, Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: () => {
        deleteMutation.mutate(id);
      }
    });
  };

  const columns: ColumnsType<WhitelistItem> = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      sorter: (a: WhitelistItem, b: WhitelistItem) => a.name.localeCompare(b.name),
    },
    {
      title: 'OS Family',
      dataIndex: 'osFamilyName',
      key: 'osFamilyName',
      render: (text: string | null) => text ? <Tag color={text === 'Windows' ? 'blue' : 'green'}>{text}</Tag> : 'N/A',
      filters: [
        { text: 'Windows', value: 'Windows' },
        { text: 'Linux', value: 'Linux' },
      ],
      onFilter: (value, record: WhitelistItem) => record.osFamilyName === value,
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: unknown, record: WhitelistItem) => (
        <Space size="small">
          <Tooltip title="View Versions">
            <Button 
              type="text"
              icon={<EyeOutlined />} 
              onClick={() => router.push(`/whitelist/versions/${record.id}`)}
            />
          </Tooltip>
          <Tooltip title="Edit">
            <Button 
              type="text" 
              icon={<EditOutlined />} 
              onClick={() => router.push(`/whitelist/edit/${record.id}`)}
            />
          </Tooltip>
          <Tooltip title="Delete">
            <Button 
              type="text" 
              danger 
              icon={<DeleteOutlined />} 
              onClick={() => confirmDelete(record.id)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <Spin>
          <div className="p-12">Loading...</div>
        </Spin>
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500">Error loading whitelist data: {String(error)}</div>;
  }

  return (
    <>
      {contextHolder}
      <Table 
        rowKey="id"
        dataSource={whitelistItems || []}
        columns={columns}
        pagination={{ 
          defaultPageSize: 10, 
          showSizeChanger: true, 
          pageSizeOptions: ['10', '20', '50']
        }}
      />
    </>
  );
}

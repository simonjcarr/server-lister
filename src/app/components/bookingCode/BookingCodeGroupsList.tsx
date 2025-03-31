import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Popconfirm, Card, Typography, Tag, Tooltip, message, App } from 'antd';
import { 
  DeleteOutlined, 
  EditOutlined, 
  PlusOutlined, 
  QuestionCircleOutlined 
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  getBookingCodeGroupsWithCodes,
  deleteBookingCodeGroup,
  deleteBookingCode 
} from '@/app/actions/bookingCodes/crudActions';
import FormAddBookingCodeGroup from './FormAddBookingCodeGroup';
import FormEditBookingCodeGroup from './FormEditBookingCodeGroup';
import FormAddBookingCode from './FormAddBookingCode';
import FormEditBookingCode from './FormEditBookingCode';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

const BookingCodeGroupsList: React.FC = () => {
  const queryClient = useQueryClient();
  const [expandedRowKeys, setExpandedRowKeys] = useState<React.Key[]>([]);
  const [messageApi, contextHolder] = message.useMessage();
  
  // Check for stored group ID to expand on initial load
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedGroupId = sessionStorage.getItem('expandBookingCodeGroupId');
      if (storedGroupId) {
        // Convert to number and set as expanded
        const groupId = parseInt(storedGroupId, 10);
        setExpandedRowKeys([groupId]);
        // Clear the stored value to prevent it from expanding on future visits
        sessionStorage.removeItem('expandBookingCodeGroupId');
      }
    }
  }, []);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['bookingCodeGroupsWithCodes'],
    queryFn: getBookingCodeGroupsWithCodes,
  });

  const deleteGroupMutation = useMutation({
    mutationFn: deleteBookingCodeGroup,
    onSuccess: (data) => {
      if (data.success) {
        messageApi.success('Booking code group deleted successfully');
        refetch();
      } else {
        messageApi.error(data.error || 'Failed to delete booking code group');
      }
    },
    onError: (error: Error) => {
      messageApi.error(error.message || 'Failed to delete booking code group');
    },
  });

  const deleteCodeMutation = useMutation({
    mutationFn: deleteBookingCode,
    onSuccess: (data) => {
      if (data.success) {
        messageApi.success('Booking code deleted successfully');
        refetch();
      } else {
        messageApi.error(data.error || 'Failed to delete booking code');
      }
    },
    onError: (error: Error) => {
      messageApi.error(error.message || 'Failed to delete booking code');
    },
  });

  const refreshData = () => {
    queryClient.invalidateQueries({ queryKey: ['bookingCodeGroupsWithCodes'] });
  };

  const handleExpand = (expanded: boolean, record: any) => {
    setExpandedRowKeys(expanded ? [record.id] : []);
  };

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      render: (text: string) => text || '-',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: any) => (
        <Space size="small">
          <FormEditBookingCodeGroup
            bookingCodeGroupId={record.id}
            onSuccess={refreshData}
          >
            <Button 
              type="text" 
              icon={<EditOutlined />} 
              size="small"
            />
          </FormEditBookingCodeGroup>
          
          <FormAddBookingCode
            groupId={record.id}
            onSuccess={refreshData}
          >
            <Button 
              type="text" 
              icon={<PlusOutlined />} 
              size="small"
              title="Add Booking Code"
            />
          </FormAddBookingCode>
          
          <Popconfirm
            title="Delete Booking Code Group"
            description="Are you sure you want to delete this booking code group? This will delete all associated booking codes."
            onConfirm={() => deleteGroupMutation.mutate(record.id)}
            okText="Yes"
            cancelText="No"
            icon={<QuestionCircleOutlined style={{ color: 'red' }} />}
          >
            <Button 
              type="text" 
              danger 
              icon={<DeleteOutlined />} 
              size="small"
              loading={deleteGroupMutation.isPending}
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const getEnabledStatusTag = (enabled: boolean) => {
    return enabled ? (
      <Tag color="green">Enabled</Tag>
    ) : (
      <Tag color="red">Disabled</Tag>
    );
  };

  const getValidityStatusTag = (validFrom: string, validTo: string) => {
    const now = dayjs();
    const fromDate = dayjs(validFrom);
    const toDate = dayjs(validTo);
    
    if (now.isBefore(fromDate)) {
      return <Tag color="orange">Future</Tag>;
    } else if (now.isAfter(toDate)) {
      return <Tag color="red">Expired</Tag>;
    } else {
      return <Tag color="green">Active</Tag>;
    }
  };

  const expandedRowRender = (record: any) => {
    const codeColumns = [
      {
        title: 'Booking Code',
        dataIndex: 'code',
        key: 'code',
      },
      {
        title: 'Description',
        dataIndex: 'description',
        key: 'description',
        render: (text: string) => text || '-',
      },
      {
        title: 'Valid From',
        dataIndex: 'validFrom',
        key: 'validFrom',
        render: (date: string) => dayjs(date).format('YYYY-MM-DD'),
      },
      {
        title: 'Valid To',
        dataIndex: 'validTo',
        key: 'validTo',
        render: (date: string) => {
          const expiryDate = dayjs(date);
          const today = dayjs();
          const daysUntilExpiry = expiryDate.diff(today, 'day');
          
          // If the code is still valid and expires within 31 days
          if (daysUntilExpiry >= 0 && daysUntilExpiry <= 30) {
            return (
              <>
                <span className="mr-2">{expiryDate.format('YYYY-MM-DD')}</span>
                <Tag color="orange">
                  {daysUntilExpiry === 0 ? 'Expires today' : `${daysUntilExpiry} day${daysUntilExpiry !== 1 ? 's' : ''} left`}
                </Tag>
              </>
            );
          }
          return expiryDate.format('YYYY-MM-DD');
        },
      },
      {
        title: 'Status',
        key: 'status',
        render: (_: any, code: any) => (
          <Space>
            {getEnabledStatusTag(code.enabled)}
            {getValidityStatusTag(code.validFrom, code.validTo)}
          </Space>
        ),
      },
      {
        title: 'Actions',
        key: 'actions',
        render: (_: any, code: any) => (
          <Space size="small">
            <FormEditBookingCode
              bookingCodeId={code.id}
              onSuccess={refreshData}
            >
              <Button 
                type="text" 
                icon={<EditOutlined />} 
                size="small"
              />
            </FormEditBookingCode>
            
            <Popconfirm
              title="Delete Booking Code"
              description="Are you sure you want to delete this booking code?"
              onConfirm={() => deleteCodeMutation.mutate(code.id)}
              okText="Yes"
              cancelText="No"
              icon={<QuestionCircleOutlined style={{ color: 'red' }} />}
            >
              <Button 
                type="text" 
                danger 
                icon={<DeleteOutlined />} 
                size="small"
                loading={deleteCodeMutation.isPending}
              />
            </Popconfirm>
          </Space>
        ),
      },
    ];

    return (
      <Card size="small" className="mt-2 mb-4">
        <Title level={5}>Booking Codes</Title>
        {record.codes && record.codes.length > 0 ? (
          <Table
            columns={codeColumns}
            dataSource={record.codes.map((code: any) => ({ ...code, key: code.id }))}
            pagination={false}
            size="small"
          />
        ) : (
          <Text type="secondary">No booking codes found for this group.</Text>
        )}
      </Card>
    );
  };

  return (
    <App>
      {contextHolder}
      <div>
        <div className="flex justify-between items-center mb-4">
          <Title level={4}>Booking Code Groups</Title>
          <FormAddBookingCodeGroup onSuccess={refreshData}>
            <Button type="primary" icon={<PlusOutlined />}>
              Add Booking Code Group
            </Button>
          </FormAddBookingCodeGroup>
        </div>
        
        <Table
          columns={columns}
          dataSource={data?.success ? data.data.map((group: any) => ({ ...group, key: group.id })) : []}
          loading={isLoading}
          expandable={{
            expandedRowRender,
            expandedRowKeys,
            onExpand: handleExpand,
          }}
        />
      </div>
    </App>
  );
};

export default BookingCodeGroupsList;
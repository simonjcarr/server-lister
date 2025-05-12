import React from 'react';
import { Card, Table, Button, Space, Popconfirm, Tag, App } from 'antd';
import { 
  DeleteOutlined, 
  PlusOutlined,
  QuestionCircleOutlined 
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  getProjectBookingCodeGroups,
  removeBookingCodeFromProject
} from '@/app/actions/bookingCodes/crudActions';
import AssignBookingCodeToProject from './AssignBookingCodeToProject';
import dayjs from 'dayjs';
import ClickToCopy from '../utils/ClickToCopy';

interface ProjectBookingCodeGroupsTableProps {
  projectId: number;
}

interface BookingCodeGroup {
  id: number;
  projectId: number;
  bookingCodeGroupId: number;
  groupName: string;
  activeBookingCode: {
    id: number;
    groupId: number;
    code: string;
    description: string | null;
    validFrom: Date;
    validTo: Date;
    enabled: boolean;
    createdAt: Date;
    updatedAt: Date;
  } | null | undefined;
  isExpired: boolean;
}

const ProjectBookingCodeGroupsTable: React.FC<ProjectBookingCodeGroupsTableProps> = ({ projectId }) => {
  const { message } = App.useApp();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['projectBookingCodeGroups', projectId],
    queryFn: () => getProjectBookingCodeGroups(projectId),
  });

  const removeMutation = useMutation({
    mutationFn: ({ projectId, bookingCodeGroupId }: { projectId: number; bookingCodeGroupId: number }) => 
      removeBookingCodeFromProject(projectId, bookingCodeGroupId),
    onSuccess: (data) => {
      if (data.success) {
        message.success('Booking code group removed from project successfully');
        queryClient.invalidateQueries({ queryKey: ['projectBookingCodeGroups', projectId] });
      } else {
        message.error(data.error || 'Failed to remove booking code group from project');
      }
    },
    onError: (error: Error) => {
      message.error(error.message || 'Failed to remove booking code group from project');
    },
  });

  const handleSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['projectBookingCodeGroups', projectId] });
  };

  const columns = [
    {
      title: 'Booking Code Group',
      dataIndex: 'groupName',
      key: 'groupName',
    },
    {
      title: 'Active Booking Code',
      key: 'activeBookingCode',
      render: (_: unknown, record: BookingCodeGroup) => {
        if (!record.activeBookingCode) {
          return <Tag color="red">No Active Code</Tag>;
        }
        return <ClickToCopy text={record.activeBookingCode.code} />;
      },
    },
    {
      title: 'Valid From',
      key: 'validFrom',
      render: (_: unknown, record: BookingCodeGroup) => {
        if (!record.activeBookingCode || !record.activeBookingCode.validFrom) {
          return '-';
        }
        return dayjs(record.activeBookingCode.validFrom).format('YYYY-MM-DD');
      },
    },
    {
      title: 'Valid To',
      key: 'validTo',
      render: (_: unknown, record: BookingCodeGroup) => {
        if (!record.activeBookingCode || !record.activeBookingCode.validTo) {
          return '-';
        }
        return dayjs(record.activeBookingCode.validTo).format('YYYY-MM-DD');
      },
    },
    {
      title: 'Enabled',
      key: 'enabled',
      render: (_: unknown, record: BookingCodeGroup) => {
        if (!record.activeBookingCode) {
          return <Tag color="red">No Active Code</Tag>;
        }

        if (record.isExpired) {
          return <Tag color="red">Expired</Tag>;
        }

        return record.activeBookingCode.enabled ? (
          <Tag color="green">Yes</Tag>
        ) : (
          <Tag color="orange">No</Tag>
        );
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: unknown, record: BookingCodeGroup) => (
        <Space size="small">
          <Popconfirm
            title="Remove Booking Code Group"
            description="Are you sure you want to remove this booking code group from the project?"
            onConfirm={() => {
              removeMutation.mutate({
                projectId: record.projectId,
                bookingCodeGroupId: record.bookingCodeGroupId,
              });
            }}
            okText="Yes"
            cancelText="No"
            icon={<QuestionCircleOutlined style={{ color: 'red' }} />}
          >
            <Button 
              type="text" 
              danger 
              icon={<DeleteOutlined />} 
              size="small"
              loading={removeMutation.isPending}
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Card
      title="Booking Code Groups"
      className="mb-4"
      extra={
        <AssignBookingCodeToProject
          projectId={projectId}
          onSuccess={handleSuccess}
        >
          <Button
            type="primary"
            icon={<PlusOutlined />}
            size="small"
          >
            Add Booking Code Group
          </Button>
        </AssignBookingCodeToProject>
      }
    >
      {data?.success && data.data && data.data.length > 0 ? (
        <Table
          columns={columns}
          dataSource={data.data.map((group: BookingCodeGroup) => ({ ...group, key: group.id }))}
          loading={isLoading}
          pagination={false}
          size="small"
        />
      ) : (
        <div className="flex flex-col items-center justify-center py-8">
          <p className="text-gray-500 mb-4">
            {isLoading 
              ? 'Loading booking code groups...' 
              : 'No booking code groups assigned to this project yet.'}
          </p>
          {!isLoading && (
            <AssignBookingCodeToProject
              projectId={projectId}
              onSuccess={handleSuccess}
            >
              <Button
                type="primary"
                icon={<PlusOutlined />}
              >
                Add Booking Code Group
              </Button>
            </AssignBookingCodeToProject>
          )}
        </div>
      )}
    </Card>
  );
};

export default ProjectBookingCodeGroupsTable;
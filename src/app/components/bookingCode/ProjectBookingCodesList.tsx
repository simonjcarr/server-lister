import React from 'react';
import { Table, Button, Space, Popconfirm, Typography, Tag, App } from 'antd';

interface ProjectWithBookingCode {
  projectId: number;
  projectName: string;
  bookingCodeGroupId: number | null;
  bookingCodeGroupName: string | null;
  key?: number;
}

// ActiveBookingCodeData removed as it was unused
import { 
  DeleteOutlined, 
  LinkOutlined, 
  QuestionCircleOutlined 
} from '@ant-design/icons';
import { useQuery, useMutation } from '@tanstack/react-query';
import { 
  getProjectsWithBookingCodes,
  removeBookingCodeFromProject,
  getProjectActiveBookingCode
} from '@/app/actions/bookingCodes/crudActions';
import AssignBookingCodeToProject from './AssignBookingCodeToProject';
import dayjs from 'dayjs';

const { Title } = Typography;

const ProjectBookingCodesList: React.FC = () => {
  const { message } = App.useApp();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['projectsWithBookingCodes'],
    queryFn: getProjectsWithBookingCodes,
  });

  const removeMutation = useMutation({
    mutationFn: ({ projectId, bookingCodeGroupId }: { projectId: number; bookingCodeGroupId: number }) => 
      removeBookingCodeFromProject(projectId, bookingCodeGroupId),
    onSuccess: (data) => {
      if (data.success) {
        message.success('Booking code removed from project successfully');
        refetch();
      } else {
        message.error(data.error || 'Failed to remove booking code from project');
      }
    },
    onError: (error: Error) => {
      message.error(error.message || 'Failed to remove booking code from project');
    },
  });

  // Component to fetch and display the active booking code
  const ActiveBookingCode: React.FC<{ projectId: number }> = ({ projectId }) => {
    const { data: activeCodeData, isLoading: activeCodeLoading } = useQuery({
      queryKey: ['projectActiveBookingCode', projectId],
      queryFn: () => getProjectActiveBookingCode(projectId),
    });

    if (activeCodeLoading) {
      return <span>Loading...</span>;
    }

    if (!activeCodeData?.success || !activeCodeData.data) {
      return <span>-</span>;
    }

    const activeCode = activeCodeData.data;
    // Check if data has an isExpired property
    const isExpired = 'isExpired' in activeCodeData && activeCodeData.isExpired === true;

    return (
      <Space direction="vertical" size="small">
        <div>
          <strong>Code:</strong> {activeCode.code}
          {isExpired && (
            <Tag color="red" className="ml-2">Expired</Tag>
          )}
        </div>
        {activeCode.validFrom && activeCode.validTo && (
          <div className="text-xs text-gray-500">
            Valid: {dayjs(activeCode.validFrom).format('YYYY-MM-DD')} to {dayjs(activeCode.validTo).format('YYYY-MM-DD')}
          </div>
        )}
      </Space>
    );
  };

  const columns = [
    {
      title: 'Project',
      dataIndex: 'projectName',
      key: 'projectName',
    },
    {
      title: 'Booking Code Group',
      dataIndex: 'bookingCodeGroupName',
      key: 'bookingCodeGroupName',
      render: (text: string | null) => text || '-',
    },
    {
      title: 'Active Booking Code',
      key: 'activeCode',
      render: (_: unknown, record: ProjectWithBookingCode) => {
        if (!record.bookingCodeGroupId) {
          return '-';
        }
        return <ActiveBookingCode projectId={record.projectId} />;
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: unknown, record: ProjectWithBookingCode) => (
        <Space size="small">
          {!record.bookingCodeGroupId ? (
            <AssignBookingCodeToProject
              projectId={record.projectId}
              onSuccess={refetch}
            >
              <Button 
                type="primary" 
                size="small"
                icon={<LinkOutlined />}
              >
                Assign
              </Button>
            </AssignBookingCodeToProject>
          ) : (
            <Popconfirm
              title="Remove Booking Code"
              description="Are you sure you want to remove this booking code from the project?"
              onConfirm={() => {
                if (record.bookingCodeGroupId) {
                  removeMutation.mutate({
                    projectId: record.projectId,
                    bookingCodeGroupId: record.bookingCodeGroupId,
                  });
                }
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
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Title level={4}>Project Booking Codes</Title>
      <Table
        columns={columns}
        dataSource={data?.success && data.data ? 
          data.data.map((project: ProjectWithBookingCode) => ({
            ...project,
            key: project.projectId,
          })) : 
          []
        }
        loading={isLoading}
      />
    </div>
  );
};

const WrappedProjectBookingCodesList = () => (
  <App>
    <ProjectBookingCodesList />
  </App>
);

export default WrappedProjectBookingCodesList;

import React from 'react';
import { Card, Typography, Tag, Space, Button } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { getProjectActiveBookingCode } from '@/app/actions/bookingCodes/crudActions';
import dayjs from 'dayjs';
import AssignBookingCodeToProject from './AssignBookingCodeToProject';
import { LinkOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

interface ProjectBookingCodeDisplayProps {
  projectId: number;
}

const ProjectBookingCodeDisplay: React.FC<ProjectBookingCodeDisplayProps> = ({ projectId }) => {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['projectActiveBookingCode', projectId],
    queryFn: () => getProjectActiveBookingCode(projectId),
  });

  if (isLoading) {
    return (
      <Card loading title="Booking Code" className="mb-4" />
    );
  }

  if (!data?.success || !data.data) {
    return (
      <Card title="Booking Code" className="mb-4">
        <div className="flex flex-col items-center justify-center py-4">
          <Text type="secondary" className="mb-4">No booking code assigned to this project.</Text>
          <AssignBookingCodeToProject
            projectId={projectId}
            onSuccess={refetch}
          >
            <Button 
              type="primary" 
              icon={<LinkOutlined />}
            >
              Assign Booking Code
            </Button>
          </AssignBookingCodeToProject>
        </div>
      </Card>
    );
  }

  const { data: bookingCode, isExpired } = data;

  return (
    <Card 
      title="Booking Code" 
      className="mb-4"
      extra={
        <AssignBookingCodeToProject
          projectId={projectId}
          onSuccess={refetch}
        >
          <Button 
            type="link" 
            size="small"
          >
            Change
          </Button>
        </AssignBookingCodeToProject>
      }
    >
      <div className="flex flex-col">
        <div className="flex items-center mb-2">
          <Title level={4} className="m-0 mr-2">{bookingCode.code}</Title>
          {isExpired ? (
            <Tag color="red">Expired</Tag>
          ) : bookingCode.enabled ? (
            <Tag color="green">Active</Tag>
          ) : (
            <Tag color="orange">Disabled</Tag>
          )}
        </div>
        
        <div className="mb-2">
          <Text type="secondary">Group: </Text>
          <Text strong>{bookingCode.groupName}</Text>
        </div>
        
        {bookingCode.description && (
          <div className="mb-2">
            <Text>{bookingCode.description}</Text>
          </div>
        )}
        
        <div className="text-xs text-gray-500">
          <Space>
            <span>Valid From: {dayjs(bookingCode.validFrom).format('YYYY-MM-DD')}</span>
            <span>Valid To: {dayjs(bookingCode.validTo).format('YYYY-MM-DD')}</span>
          </Space>
        </div>
      </div>
    </Card>
  );
};

export default ProjectBookingCodeDisplay;

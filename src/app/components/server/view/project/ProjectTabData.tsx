'use client'

import React from 'react'
import { useQuery } from "@tanstack/react-query"
import { getServerById } from "@/app/actions/server/crudActions"
import { Alert, Row, Spin, Col, Divider, Typography, Tag } from 'antd'
import ServerBookingCode from '../bookingCode/ServerBookingCode'
import { getProjectById } from '@/app/actions/projects/crudActions'

const { Text } = Typography;

const ProjectTabData = ({ serverId }: { serverId: number }) => {
  const { data: server, error: serverError, isLoading: isLoadingServer } = useQuery({
    queryKey: ["server", serverId],
    queryFn: () => getServerById(serverId),
    enabled: !!serverId,
  });
  
  const { data: project, error: projectError, isLoading: isLoadingProject } = useQuery({
    queryKey: ["project", server?.projectId],
    queryFn: () => server?.projectId ? getProjectById(server.projectId) : null,
    enabled: !!server?.projectId,
  });

  const isLoading = isLoadingServer || isLoadingProject;
  const error = serverError || projectError;

  if (isLoading) return <Spin />;
  if (error) return <Alert message="Error" description={error instanceof Error ? error.message : 'An error occurred'} type="error" />;
  
  if (!server?.projectId) {
    return (
      <div>
        <div className="text-lg font-bold mb-4">Project</div>
        <Alert 
          message="No project assigned" 
          description="This server is not assigned to any project." 
          type="info" 
          showIcon 
        />
      </div>
    );
  }

  return (
    <div>
      <div className="text-lg font-bold mb-4">Project</div>
      {project && (
        <>
          <div>
            <Row className='border-b border-gray-700 py-2'>
              <Col span={8}>Project Name</Col>
              <Col span={16}>{project.name}</Col>
            </Row>
            
            {project.code && (
              <Row className='border-b border-gray-700 py-2'>
                <Col span={8}>Project Code</Col>
                <Col span={16}>{project.code}</Col>
              </Row>
            )}
            
            {project.description && (
              <Row className='border-b border-gray-700 py-2'>
                <Col span={8}>Description</Col>
                <Col span={16}>{project.description}</Col>
              </Row>
            )}
            
            {project.businessName && (
              <Row className='border-b border-gray-700 py-2'>
                <Col span={8}>Business</Col>
                <Col span={16}>{project.businessName}</Col>
              </Row>
            )}
          </div>
          
          <Divider />
          
          <div>
            <div className="text-lg font-bold mb-2">Booking Code</div>
            <ServerBookingCode serverId={serverId} />
          </div>
        </>
      )}
    </div>
  );
};

export default ProjectTabData;

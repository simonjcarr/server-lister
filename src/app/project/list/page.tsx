'use client';

import { useQuery } from "@tanstack/react-query";
import { getProjects } from "@/app/actions/projects/crudActions";
import type { ProjectData } from "@/app/actions/projects/crudActions";
import { Input, Table, Typography, Card, Space, Button } from "antd";
import { SearchOutlined, PlusOutlined } from '@ant-design/icons';
import { useState } from "react";
import { useRouter } from "next/navigation";
import FormAddProject from "@/app/components/project/FormAddProject";

const { Title } = Typography;

export default function ProjectListPage() {
  const [filter, setFilter] = useState('');
  const router = useRouter();
  
  const { data, isLoading, isError } = useQuery({
    queryKey: ['projects'],
    queryFn: getProjects
  });

  return (
    <div className="p-4">
      <Card>
        <div className="flex flex-row justify-between items-center mb-6">
          <Title level={2}>Projects</Title>
          <FormAddProject>
            <Button type="primary" icon={<PlusOutlined />}>
              Add Project
            </Button>
          </FormAddProject>
        </div>
        
        {isLoading && <p>Loading projects...</p>}
        {isError && <p>Error loading projects</p>}
        
        {data && (
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <Input
              prefix={<SearchOutlined />}
              placeholder="Search projects..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="mb-4"
              style={{ maxWidth: '400px' }}
            />
            
            <Table
              onRow={(record: ProjectData) => ({
                onClick: () => {
                  router.push(`/project/${record.id}`);
                },
                style: { cursor: 'pointer' }
              })}
              rowKey="id"
              columns={[
                {
                  title: 'Name',
                  dataIndex: 'name',
                  key: 'name',
                  sorter: (a: ProjectData, b: ProjectData) => a.name.localeCompare(b.name)
                },
                {
                  title: 'Business',
                  dataIndex: 'businessName',
                  key: 'business',
                  sorter: (a: ProjectData, b: ProjectData) => (a.businessName || '').localeCompare(b.businessName || '')
                },
                {
                  title: 'Code',
                  dataIndex: 'code',
                  key: 'code',
                },
                {
                  title: 'Created',
                  dataIndex: 'createdAt',
                  key: 'createdAt',
                  render: (createdAt: Date) => new Date(createdAt).toLocaleDateString(),
                  sorter: (a: ProjectData, b: ProjectData) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
                },
                {
                  title: 'Updated',
                  dataIndex: 'updatedAt',
                  key: 'updatedAt',
                  render: (updatedAt: Date) => new Date(updatedAt).toLocaleDateString(),
                  sorter: (a: ProjectData, b: ProjectData) => new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()
                }
              ]}
              dataSource={data.filter((project) => 
                project.name.toLowerCase().includes(filter.toLowerCase()) || 
                (project.businessName || '').toLowerCase().includes(filter.toLowerCase()) || 
                (project.code || '').toLowerCase().includes(filter.toLowerCase())
              )}
              pagination={{ pageSize: 20 }}
            />
          </Space>
        )}
      </Card>
    </div>
  );
}

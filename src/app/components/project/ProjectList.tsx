import { useQuery } from "@tanstack/react-query"
import { getProjects } from "@/app/actions/projects/crudActions"
import type { ProjectData } from "@/app/actions/projects/crudActions"
import { Card, Input, Table, Typography } from "antd"
import { SearchOutlined } from '@ant-design/icons';
import { useState } from "react"
import { useRouter } from "next/navigation"

interface ProjectListProps {
  compact?: boolean;
  onSelect?: (project: ProjectData) => void;
}

const ProjectList = ({ compact = false, onSelect }: ProjectListProps) => {
  const [filter, setFilter] = useState('')
  const router = useRouter()
  const { data, isLoading, isError } = useQuery({
    queryKey: ['projects'],
    queryFn: getProjects
  })
  
  const handleRowClick = (record: ProjectData) => {
    if (onSelect) {
      onSelect(record);
    } else {
      router.push(`/project/${record.id}`);
    }
  };

  // Define columns based on compact mode
  const columns = [
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
    }
  ];

  // Add additional columns when not in compact mode
  if (!compact) {
    columns.push(
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
    );
  }

  return (
    <Card>
      {isLoading && <p>Loading...</p>}
      {isError && <p>Error loading projects</p>}
      {data && (
        <>
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
              onClick: () => handleRowClick(record),
              style: { cursor: 'pointer' }
            })}
            rowKey="id"
            columns={columns as any[]}
            dataSource={data.filter((project) => 
              project.name.toLowerCase().includes(filter.toLowerCase()) || 
              (project.businessName || '').toLowerCase().includes(filter.toLowerCase()) || 
              (project.code || '').toLowerCase().includes(filter.toLowerCase())
            )}
            pagination={{ pageSize: compact ? 10 : 20 }}
          />
        </>
      )}
    </Card>
  )
}

export default ProjectList
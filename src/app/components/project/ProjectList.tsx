import { useQuery } from "@tanstack/react-query";
import {
  getProjects,
  type ProjectData,
  deleteProject
} from "@/app/actions/projects/crudActions";
import { getProjectsWithBookingCodes } from "@/app/actions/bookingCodes/crudActions";
import { Card, Input, Table, Space, Button, App, Popconfirm } from "antd";
import type { ColumnsType } from 'antd/es/table';
import { SearchOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface ProjectListProps {
  compact?: boolean;
  onSelect?: (project: ProjectData) => void;
}

const ProjectList = ({ compact = false, onSelect }: ProjectListProps) => {
  const [filter, setFilter] = useState("");
  const router = useRouter();
  const { message } = App.useApp();

  // Fetch projects
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["projects"],
    queryFn: getProjects,
  });

  // Fetch projects with booking code groups
  const { data: bookingCodesData } = useQuery({
    queryKey: ["projectsWithBookingCodes"],
    queryFn: getProjectsWithBookingCodes,
  });

  // Create a map of projectId to booking code group name
  const projectBookingCodeMap = new Map<number, string>();
  if (bookingCodesData?.success && bookingCodesData.data) {
    bookingCodesData.data.forEach((item) => {
      if (item.bookingCodeGroupName) {
        projectBookingCodeMap.set(item.projectId, item.bookingCodeGroupName);
      }
    });
  }

  // Handle row click
  const handleRowClick = (record: ProjectData) => {
    if (onSelect) {
      onSelect(record);
    } else {
      router.push(`/project/${record.id}`);
    }
  };

  // Handle delete project
  const handleDeleteProject = async (id: number) => {
    try {
      const result = await deleteProject(id);
      if (result.success) {
        message.success("Project deleted successfully");
        refetch();
      } else {
        message.error(result.error || "Failed to delete project");
      }
    } catch {
      message.error("An error occurred while deleting the project");
    }
  };

  // Define columns based on compact mode and requirements
  const columns: ColumnsType<ProjectData> = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      sorter: (a: ProjectData, b: ProjectData) => a.name.localeCompare(b.name),
    },
    {
      title: "Business",
      dataIndex: "businessName",
      key: "business",
      sorter: (a: ProjectData, b: ProjectData) =>
        (a.businessName || "").localeCompare(b.businessName || ""),
    },
    {
      title: "Code",
      dataIndex: "code",
      key: "code",
    },
    {
      title: "Booking Code Group",
      key: "bookingCodeGroup",
      render: (_: unknown, record: ProjectData) => 
        projectBookingCodeMap.get(record.id) || "-",
    },
  ];

  // Add actions column when not in compact mode
  if (!compact) {
    columns.push({
      title: "Actions",
      key: "actions",
      width: 120,
      render: (_: unknown, record: ProjectData) => (
        <Space size="small" onClick={(e) => e.stopPropagation()}>
          <Link href={`/project/edit/${record.id}`} passHref>
            <Button
              type="text"
              icon={<EditOutlined />}
              size="small"
              title="Edit"
            />
          </Link>
          <Popconfirm
            title="Delete Project"
            description="Are you sure you want to delete this project?"
            onConfirm={(e) => {
              e?.stopPropagation();
              handleDeleteProject(record.id);
            }}
            okText="Yes"
            cancelText="No"
            placement="left"
          >
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              size="small"
              title="Delete"
              onClick={(e) => e.stopPropagation()}
            />
          </Popconfirm>
        </Space>
      ),
    });
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
            style={{ maxWidth: "400px" }}
          />
          <Table
            onRow={(record: ProjectData) => ({
              onClick: () => handleRowClick(record),
              style: { cursor: "pointer" },
            })}
            rowKey="id"
            columns={columns}
            dataSource={data.filter(
              (project) =>
                project.name.toLowerCase().includes(filter.toLowerCase()) ||
                (project.businessName || "")
                  .toLowerCase()
                  .includes(filter.toLowerCase()) ||
                (project.code || "").toLowerCase().includes(filter.toLowerCase())
            )}
            pagination={{ pageSize: compact ? 10 : 20 }}
            size="small"
          />
        </>
      )}
    </Card>
  );
};

export default ProjectList;
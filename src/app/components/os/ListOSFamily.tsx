'use client'
import React from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getOSFamilyWithOSCount, deleteOSFamily } from '@/app/actions/os/osFamilyActions'
import { Button, Card, Table, notification, Popconfirm } from 'antd'
import FormEditOSFamily from './FormEditOSFamily'
import FormAddOS from './FormAddOS'
import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons'
import type { SelectOSFamily } from '@/db/schema'

type OSFamilyWithCount = SelectOSFamily & {
  osCount: number;
};

const ListOSFamily = () => {
  const [messageApi, contextHolder] = notification.useNotification();
  const queryClient = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery<OSFamilyWithCount[]>({
    queryKey: ['osFamilyWithCount'],
    queryFn: () => getOSFamilyWithOSCount(),
  });

  const handleDelete = async (id: number) => {
    try {
      const result = await deleteOSFamily(id);
      
      if (result.success) {
        messageApi.success({
          message: "Deleted",
          description: "OS Family has been deleted successfully",
          duration: 3,
        });
        refetch(); // Refresh data
        
        // Invalidate all OS family related queries
        queryClient.invalidateQueries({ queryKey: ['osFamilies'] });
        queryClient.invalidateQueries({ queryKey: ['osFamilyWithCount'] });
        
        // Also invalidate OS queries since they may reference the family
        queryClient.invalidateQueries({ queryKey: ['oss'] });
      } else {
        messageApi.error({
          message: "Failed",
          description: result.message || "Failed to delete OS Family",
          duration: 3,
        });
      }
    } catch (error) {
      console.error("Error deleting OS Family:", error);
      messageApi.error({
        message: "Failed",
        description: "An unexpected error occurred while deleting the OS Family",
        duration: 3,
      });
    }
  };

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      sorter: (a: OSFamilyWithCount, b: OSFamilyWithCount) => a.name.localeCompare(b.name),
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: 'OS Count',
      dataIndex: 'osCount',
      key: 'osCount',
      sorter: (a: OSFamilyWithCount, b: OSFamilyWithCount) => a.osCount - b.osCount,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: unknown, record: OSFamilyWithCount) => (
        <div className="flex space-x-2">
          <FormEditOSFamily id={record.id}>
            <Button icon={<EditOutlined />} type="link" />
          </FormEditOSFamily>
          
          <Popconfirm
            title="Delete OS Family"
            description={`Are you sure you want to delete ${record.name}?`}
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
            disabled={record.osCount > 0}
          >
            <Button 
              icon={<DeleteOutlined />} 
              type="link" 
              danger
              disabled={record.osCount > 0}
              title={record.osCount > 0 ? "Cannot delete OS Family that is in use" : "Delete OS Family"}
            />
          </Popconfirm>
        </div>
      ),
    },
  ];

  return (
    <div>
      {contextHolder}
      <Card 
        title="OS Families" 
        extra={
          <FormAddOS initialTab="osFamily">
            <Button type="primary" icon={<PlusOutlined />}>Add OS Family</Button>
          </FormAddOS>
        }
      >
        {isLoading && <p>Loading...</p>}
        {error && <p>Error: {error instanceof Error ? error.message : String(error)}</p>}
        {data && (
          <Table 
            columns={columns} 
            dataSource={data.map(family => ({...family, key: family.id}))} 
            rowKey="id" 
          />
        )}
      </Card>
    </div>
  )
}

export default ListOSFamily
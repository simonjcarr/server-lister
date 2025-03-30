'use client'
import React, { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getOSs, deleteOS, type OSWithPatchVersion } from '@/app/actions/os/crudActions'
import { Button, Card, Table, Tabs, Popconfirm, notification } from 'antd'
import FormEditOS from '../components/os/FormEditOS'
import FormAddOS from '../components/os/FormAddOS'
import ListOSFamily from '../components/os/ListOSFamily'
import { CalendarOutlined, PlusOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons'
import type { TabsProps } from 'antd'
const { TabPane } = Tabs;

type TabKey = 'os' | 'osFamily';

const Page = () => {
  const [activeTab, setActiveTab] = useState<TabKey>('os');
  const [messageApi, contextHolder] = notification.useNotification();
  const queryClient = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery<OSWithPatchVersion[]>({
    queryKey: ['oss'],
    queryFn: () => getOSs(),
  });

  // Handle OS deletion
  const handleDeleteOS = async (id: number) => {
    try {
      const result = await deleteOS(id);
      
      if (result.success) {
        messageApi.success({
          message: "Deleted",
          description: "OS has been deleted successfully",
          duration: 3,
        });
        
        // Refresh OS data
        refetch();
        
        // Invalidate all related queries
        queryClient.invalidateQueries({ queryKey: ['oss'] });
        queryClient.invalidateQueries({ queryKey: ['os'] });
        
        // Also invalidate OS Family queries to update counts
        queryClient.invalidateQueries({ queryKey: ['osFamilyWithCount'] });
        queryClient.invalidateQueries({ queryKey: ['osFamilies'] });
      } else {
        messageApi.error({
          message: "Failed",
          description: "Failed to delete OS",
          duration: 3,
        });
      }
    } catch (error) {
      console.error("Error deleting OS:", error);
      messageApi.error({
        message: "Failed",
        description: "An unexpected error occurred while deleting the OS",
        duration: 3,
      });
    }
  };

  // Define columns for the OS table
  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      sorter: (a: OSWithPatchVersion, b: OSWithPatchVersion) => a.name.localeCompare(b.name),
    },
    {
      title: 'Version',
      dataIndex: 'version',
      key: 'version',
    },
    {
      title: 'OS Family',
      dataIndex: 'familyName',
      key: 'familyName',
      render: (text: string | null) => text || 'Not Assigned',
      filters: Array.from(new Set(data?.map(os => os.familyName).filter(Boolean) || []))
        .map(family => ({ text: family, value: family })),
      onFilter: (value: string, record: OSWithPatchVersion) => record.familyName === value,
    },
    {
      title: (<div className='flex items-center gap-2'><CalendarOutlined /> EOL Date</div>),
      dataIndex: 'EOLDate',
      key: 'EOLDate',
      render: (text: string) => new Date(text).toLocaleDateString(),
      sorter: (a: OSWithPatchVersion, b: OSWithPatchVersion) => new Date(a.EOLDate).getTime() - new Date(b.EOLDate).getTime(),
    },
    {
      title: 'Latest Patch',
      dataIndex: 'latestPatchVersion',
      key: 'latestPatchVersion',
    },
    {
      title: 'Actions',
      dataIndex: 'id',
      key: 'id',
      render: (text: string, record: OSWithPatchVersion) => (
        <div className="flex space-x-2">
          <FormEditOS id={record.id}>
            <Button icon={<EditOutlined />} type="link" />
          </FormEditOS>
          
          <Popconfirm
            title="Delete Operating System"
            description={`Are you sure you want to delete ${record.name}?`}
            onConfirm={() => handleDeleteOS(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button 
              icon={<DeleteOutlined />} 
              type="link" 
              danger
              title="Delete OS"
            />
          </Popconfirm>
        </div>
      ),
    }
  ];

  // OS table rendering function
  const renderOSTable = () => {
    return (
      <>
        {isLoading && <p>Loading...</p>}
        {error && <p>Error: {error.message}</p>}
        {data && (
          <Table 
            columns={columns} 
            dataSource={data} 
            rowKey="id" 
          />
        )}
      </>
    );
  };

  // Define tabs items
  const tabItems: TabsProps['items'] = [
    {
      key: 'os',
      label: 'Operating Systems',
      children: renderOSTable(),
    },
    {
      key: 'osFamily',
      label: 'OS Families',
      children: <ListOSFamily />,
    },
  ];
  return (
    <div>
      {contextHolder}
      <Card 
        title="Operating System Management"
        extra={
          activeTab === 'os' ? (
            <FormAddOS>
              <Button type="primary" icon={<PlusOutlined />}>Add OS</Button>
            </FormAddOS>
          ) : null
        }
      >
        <Tabs 
          activeKey={activeTab} 
          onChange={(key) => setActiveTab(key as TabKey)}
          className="mb-4"
          items={tabItems}
        />
      </Card>
    </div>
  )
}

export default Page
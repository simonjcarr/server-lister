'use client'
import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getOSs, type OSWithPatchVersion } from '@/app/actions/os/crudActions'
import { Button, Card, Table, Tabs } from 'antd'
import FormEditOS from '../components/os/FormEditOS'
import FormAddOS from '../components/os/FormAddOS'
import ListOSFamily from '../components/os/ListOSFamily'
import { CalendarOutlined, PlusOutlined } from '@ant-design/icons'
import type { TabsProps } from 'antd'
const { TabPane } = Tabs;

type TabKey = 'os' | 'osFamily';

const Page = () => {
  const [activeTab, setActiveTab] = useState<TabKey>('os');

  const { data, isLoading, error } = useQuery<OSWithPatchVersion[]>({
    queryKey: ['oss'],
    queryFn: () => getOSs(),
  });

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
        <FormEditOS id={record.id}>
          <Button type="link">Edit</Button>
        </FormEditOS>
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
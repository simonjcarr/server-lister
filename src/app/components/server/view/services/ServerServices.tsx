'use client'
import { useQuery } from "@tanstack/react-query"
import { getServerServices } from "@/app/actions/scan/crudActions"
import { Alert, Empty, Form, Input, Spin, Table } from "antd"
import type { ScanResults } from "@/db/schema"
import { useState } from "react"
import { SearchOutlined } from "@ant-design/icons"

const ServerServices = ({ serverId }: { serverId: number }) => {

  const columns = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      sorter: (a: Partial<ScanResults['services'][number]>, b: Partial<ScanResults['services'][number]>) => (a.name && b.name) ? a.name.localeCompare(b.name) : 0,
    },
    {
      title: "Port",
      dataIndex: "port",
      key: "port",
    },
    {
      title: "Running",
      dataIndex: "running",
      render: (text: boolean) => text ? <span className="text-green-500">Yes</span> : <span className="text-red-500">No</span>,
      key: "running",
      sorter: (a: Partial<ScanResults['services'][number]>, b: Partial<ScanResults['services'][number]>) => {
        // Convert booleans to numbers (true = 1, false = 0) for sorting
        const aVal = a.running ? 1 : 0;
        const bVal = b.running ? 1 : 0;
        return bVal - aVal; // Descending order so true values appear first
      },
    }
  ]

  const [searchName, setSearchName] = useState('')

  const { data, error, isLoading } = useQuery({
    queryKey: ["server", 'services', serverId],
    queryFn: () => getServerServices(serverId),
    enabled: !!serverId,
    staleTime: 600000, // 10 minutes
    refetchInterval: 600000, // 10 minutes
  })
  return (
    <div>
      <div className="text-2xl font-bold mb-4">Services</div>
      <div className="mb-4">
        <Form layout="inline">
          <Form.Item className="w-full" name="name"><Input prefix={<SearchOutlined />} placeholder="Search..." value={searchName} onChange={(e) => setSearchName(e.target.value)} /></Form.Item>
        </Form>
      </div>
      {isLoading && <Spin />}
      {error && <div><Empty className="flex justify-center" image={Empty.PRESENTED_IMAGE_SIMPLE} /></div>}
      {data && Array.isArray(data) && data.length > 0 ? (
        <>
          <Table 
            columns={columns} 
            dataSource={data.filter((item) => 
              item && item.name && item.name.toLowerCase().includes(searchName.toLowerCase())
            )} 
            rowKey="name" 
            size="small" 
          />
        </>
      ) : (
        !isLoading && !error && <Alert message="Info" description="No services found" type="info" />
      )}
    </div>
  )
}

export default ServerServices
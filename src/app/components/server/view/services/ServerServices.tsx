'use client'
import { useQuery } from "@tanstack/react-query"
import { getServerServices } from "@/app/actions/scan/crudActions"
import { Alert, Form, Input, Spin, Table } from "antd"
import type { ScanResults } from "@/db/schema"
import { useState } from "react"


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
      <div className="mb-4">
        <Form layout="inline">
          <Form.Item className="w-full" name="name"><Input placeholder="Search..." value={searchName} onChange={(e) => setSearchName(e.target.value)} /></Form.Item>
        </Form>
      </div>
      {isLoading && <Spin />}
      {error && <Alert message="Error" description={error instanceof Error ? error.message : 'An error occurred'} type="error" />}
      {data && data.length > 0 && (
        <>
          <Table columns={columns} dataSource={data.filter((item) => item.name.toLowerCase().includes(searchName.toLowerCase()))} rowKey="name" size="small" />
        </>
      )}
    </div>
  )
}

export default ServerServices
import { useQuery } from "@tanstack/react-query"
import { getServerUsers } from "@/app/actions/scan/crudActions"
import { Empty, Form, Input, Spin, Table } from "antd"
import { ScanResults } from "@/db/schema"
import { useState } from "react"
import { SearchOutlined } from "@ant-design/icons"

const ServerUsers = ({ serverId }: { serverId: number }) => {
  const [searchName, setSearchName] = useState('')
  const { data, isLoading, error } = useQuery({
    queryKey: ['server-users', serverId],
    queryFn: () => getServerUsers(serverId),
  })
  const columns = [
    {
      title: "Username",
      dataIndex: "username",
      key: "username",
      sorter: (a: Partial<ScanResults['host']['users'][number]>, b: Partial<ScanResults['host']['users'][number]>) => (a.username && b.username) ? a.username.localeCompare(b.username) : 0,
    },
    {
      title: "Local Account",
      dataIndex: "localAccount",
      key: "localAccount",
      render: (text: boolean) => text ? <div className="text-green-500">Yes</div> : <div className="text-red-500">No</div>,
      sorter: (a: Partial<ScanResults['host']['users'][number]>, b: Partial<ScanResults['host']['users'][number]>) => {
        if (a.localAccount === undefined || b.localAccount === undefined) return 0;
        // Convert booleans to numbers for comparison: true > false
        return (a.localAccount === b.localAccount) ? 0 : (a.localAccount ? 1 : -1);
      },
    }
  ]
  return (
    <div>
      <div className="text-2xl font-bold mb-4">Server Users</div>
      <div className="mb-4">
        <Form layout="inline">
          
          <Form.Item className="w-full" name="username" ><Input prefix={<SearchOutlined />} placeholder="Search..." value={searchName} onChange={(e) => setSearchName(e.target.value)} /></Form.Item>
        </Form>
      </div>
      {isLoading && <Spin />}
      {error && <div><Empty className="flex justify-center" image={Empty.PRESENTED_IMAGE_SIMPLE} /></div>}
      {data && (
        <>
        <Table
            columns={columns}
            dataSource={data.filter((item) => 
              item && item.username && item.username.toLowerCase().includes(searchName.toLowerCase())
            )}
            rowKey="username"
            size="small"
        />
        </>
      )}
    </div>
  )
}

export default ServerUsers
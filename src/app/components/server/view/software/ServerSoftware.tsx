import { useQuery} from "@tanstack/react-query"
import { getServerSoftware } from "@/app/actions/scan/crudActions"
import { Empty, Form, Input, Spin, Table } from "antd"
import { ScanResults } from "@/db/schema"
import { useState } from "react"

const ServerSoftware = ({ serverId }: { serverId: number }) => {
  const [searchName, setSearchName] = useState('')
  const { data, error, isLoading } = useQuery({
    queryKey: ["server", "software", serverId],
    queryFn: () => getServerSoftware(serverId),
    enabled: !!serverId,
  })
  const columns = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      sorter: (a: Partial<ScanResults['software'][number]>, b: Partial<ScanResults['software'][number]>) => (a.name && b.name) ? a.name.localeCompare(b.name) : 0,
    },
    {
      title: "Version",
      dataIndex: "version",
      key: "version",
    }
  ]
  
  return (
    <div>
      <div className="text-2xl font-bold mb-4">Software</div>
      {isLoading && <Spin />}
      {error && <div><Empty className="flex justify-center" image={Empty.PRESENTED_IMAGE_SIMPLE} /></div>}
      {data && (
        <>
          {data && data.length > 0 && (
            <>
            <div className="mb-4">
              <Form layout="inline">
                <Form.Item className="w-full" name="name"><Input placeholder="Search..." value={searchName} onChange={(e) => setSearchName(e.target.value)} /></Form.Item>
              </Form>
            </div>
            <Table columns={columns} dataSource={data.filter((item) => item.name.toLowerCase().includes(searchName.toLowerCase()))} rowKey="name" size="small"/>
            </>
          )}
        </>
      )}
    </div>
  )
}

export default ServerSoftware
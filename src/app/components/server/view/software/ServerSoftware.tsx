import { useQuery} from "@tanstack/react-query"
import { getServerSoftware } from "@/app/actions/scan/crudActions"
import { Alert, Spin, Table } from "antd"
import { ScanResults } from "@/db/schema"

const ServerSoftware = ({ serverId }: { serverId: number }) => {
  const { data, error, isLoading } = useQuery({
    queryKey: ["server", serverId],
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
      {isLoading && <Spin />}
      {error && <Alert message="Error" description={error instanceof Error ? error.message : 'An error occurred'} type="error" />}
      {data && (
        <>
          {data &&  <Table columns={columns} dataSource={data} rowKey="name" size="small"/>}
        </>
      )}
    </div>
  )
}

export default ServerSoftware
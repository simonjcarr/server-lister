import { useQuery } from "@tanstack/react-query"
import { getServerUsers } from "@/app/actions/scan/crudActions"
import { Empty, Spin, Table } from "antd"
import { ScanResults } from "@/db/schema"

const ServerUsers = ({ serverId }: { serverId: number }) => {
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
      {isLoading && <Spin />}
      {error && <div><Empty className="flex justify-center" image={Empty.PRESENTED_IMAGE_SIMPLE} /></div>}
      {data && (
        <>
        <Table
            columns={columns}
            dataSource={data}
            rowKey="username"
            size="small"
        />
        </>
      )}
    </div>
  )
}

export default ServerUsers
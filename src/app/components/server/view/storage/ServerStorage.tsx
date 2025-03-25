import { useQuery } from "@tanstack/react-query"
import { Empty, Spin, Table } from "antd"
import { getServerStorage } from "@/app/actions/scan/crudActions"

type Storage = {
  diskMountPath: string
  totalGB: number
  usedGB: number
}

const ServerStorage = ({ serverId }: { serverId: number }) => {
  const { data, error, isLoading } = useQuery({
    queryKey: ["server", serverId],
    queryFn: () => getServerStorage(serverId),
    enabled: !!serverId,
  })
  const columns = [
    {
      title: "Mount",
      dataIndex: "diskMountPath",
      key: "diskMountPath",
    },
    {
      title: "Total (GB)",
      dataIndex: "totalGB",
      key: "totalGB",
      render: (text: string, record: Storage) => record.totalGB.toFixed(2),
    },
    {
      title: "Used (GB)",
      dataIndex: "usedGB",
      key: "usedGB",
      render: (text: string, record: Storage) => record.usedGB.toFixed(2),
    },
    {
      title: "Available (GB)",
      render: (text: string, record: Storage) => (record.totalGB - record.usedGB).toFixed(2),
      key: "availableGB",
    },
  ]
  return (
    <div>
      <div className="text-2xl font-bold mb-4">Storage</div>
      {isLoading && <Spin />}
      {error && <div><Empty className="flex justify-center" image={Empty.PRESENTED_IMAGE_SIMPLE} /></div>}
      {data && data.length > 0 && (
        <>
        <Table columns={columns} dataSource={data} rowKey="diskMountPath" />
        </>
      )}
    </div>
  )
}


export default ServerStorage
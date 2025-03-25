import { useQuery } from "@tanstack/react-query"
import { Alert, Spin, Table } from "antd"
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
    <>
      {isLoading && <Spin />}
      {error && <Alert message="Error" description={error instanceof Error ? error.message : 'An error occurred'} type="error" />}
      {data && data.length > 0 && (
        <>
        <Table columns={columns} dataSource={data} rowKey="diskMountPath" />
        </>
      )}
    </>
  )
}


export default ServerStorage
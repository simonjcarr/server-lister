import { useQuery } from "@tanstack/react-query"
import { Col, Empty, Progress, Row, Spin, Table } from "antd"
import { getServerStorage } from "@/app/actions/scan/crudActions"
import type { ProgressProps } from 'antd';

type Storage = {
  diskMountPath: string
  totalGB: number
  usedGB: number
}

const SpaceAvailable = ({ record }: { record: Storage }) => {
  const conicColors: ProgressProps['strokeColor'] = {
    '0%': '#00ff00',
    '50%': '#FFBF00',
    '100%': '#ff0000',
  };
  const available = record.totalGB - record.usedGB
  const percentage = 100 -(available / record.totalGB) * 100
  console.log(record.diskMountPath,percentage)
  return (
    <Row>
      <Col span={16}>{available.toFixed(2)}</Col>
      <Col span={8}>
      <Progress
        type="circle"
        percent={percentage}
        strokeColor={conicColors}
        size={20}
      />
      </Col>
    </Row>
  )
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
      render: (text: string, record: Storage) => <SpaceAvailable record={record} />,
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
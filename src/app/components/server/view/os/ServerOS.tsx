'use client'
import { useQuery } from "@tanstack/react-query";
import { getServerOS } from "@/app/actions/scan/crudActions";
import { Col, Empty, Row, Spin } from "antd";

const ServerOS = ({ serverId }: { serverId: number }) => {
  const { data, error, isLoading } = useQuery({
    queryKey: ["server", 'os', serverId],
    queryFn: () => getServerOS(serverId),
    enabled: !!serverId,
    staleTime: 600000, // 10 minutes
    refetchInterval: 600000, // 10 minutes
  })

  const tableData = [
    { key: 'name', label: 'Name', value: data?.name },
    { key: 'version', label: 'Version', value: data?.version },
    { key: 'patch_version', label: 'Patch Version', value: data?.patch_version },
  ]
  return (
    <div>
      <div className="text-2xl font-bold mb-4">Server OS</div>
      {isLoading && <Spin />}
      {error && <div><Empty className="flex justify-center" image={Empty.PRESENTED_IMAGE_SIMPLE} /></div>}
      {data && (
        <div>
          {tableData.map((item) => (
            <Row key={item.key} className="border-b border-gray-700 py-2">
              <Col span={8}>{item.label}</Col>
              <Col span={16}>{item.value}</Col>
            </Row>
          ))}
        </div>
      ) 
      
      }
    </div>
  )
}

export default ServerOS
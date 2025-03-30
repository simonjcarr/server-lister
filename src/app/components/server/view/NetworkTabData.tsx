import React from 'react'
import { useQuery } from "@tanstack/react-query"
import { getServerById } from "@/app/actions/server/crudActions"
import { Alert, Row, Spin, Col } from 'antd'

const NetworkTabData = ({ serverId }: { serverId: number }) => {
  const { data, error, isLoading } = useQuery({
    queryKey: ["server", serverId],
    queryFn: () => getServerById(serverId),
    enabled: !!serverId,
  })
  const tableData = [
    { key: 'hostname', label: 'Hostname', value: data?.hostname },
    { key: 'ipv4', label: 'IPV4', value: data?.ipv4 },
    { key: 'ipv6', label: 'IPV6', value: data?.ipv6 },
    { key: 'macAddress', label: 'MAC Address', value: data?.macAddress },
  ]
  return (
    <div>
      {isLoading && <Spin />}
      {error && <Alert message="Error" description={error instanceof Error ? error.message : 'An error occurred'} type="error" />}
      {data && (
        <>
          <div>
            <div className="text-lg font-bold">Network</div>
            {tableData.map((item) => (
              <Row key={item.key} className='border-b border-gray-700 py-2'>
                <Col span={8}>{item.label}</Col>
                <Col span={16}>{item.value}</Col>
              </Row>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export default NetworkTabData
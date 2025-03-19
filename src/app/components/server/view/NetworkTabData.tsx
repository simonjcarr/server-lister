import React from 'react'
import { useQuery } from "@tanstack/react-query"
import { getServerById } from "@/app/actions/server/crudActions"
import { Alert, Spin } from 'antd'

const NetworkTabData = ({ serverId }: { serverId: number }) => {
  const { data, error, isLoading } = useQuery({
    queryKey: ["server", serverId],
    queryFn: () => getServerById(serverId),
    enabled: !!serverId,
  })
  return (
    <div>
      {isLoading && <Spin />}
      {error && <Alert message="Error" description={error instanceof Error ? error.message : 'An error occurred'} type="error" />}
      {data && (
        <>
          <p>Hostname: {data.hostname}</p>
          <p>IPV4: {data.ipv4}</p>
          <p>IPV6: {data.ipv6}</p>
        </>
      )}
    </div>
  )
}

export default NetworkTabData
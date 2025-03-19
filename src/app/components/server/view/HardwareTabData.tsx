import { useQuery } from "@tanstack/react-query"
import { getServerById } from "@/app/actions/server/crudActions"
import { Alert, Spin } from "antd"
const HardwareTabData = ({ serverId }: { serverId: number }) => {
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
          <p>Cores: {data.cores}</p>
          <p>RAM: {data.ram}</p>
          <p>Storage: {data.diskSpace}</p>
        </>
      )}
    </div>
  )
}

export default HardwareTabData
import { useQuery } from "@tanstack/react-query"
import { getServerById } from "@/app/actions/server/crudActions"
import { Alert, Spin, Statistic } from "antd"
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
        <div className="flex gap-8">
          { data.cores && <Statistic title="CPU Cores" value={data.cores} />}
          { data.ram && <Statistic title="RAM" value={data.ram} />}
        </div>
        </>
      )}
    </div>
  )
}

export default HardwareTabData
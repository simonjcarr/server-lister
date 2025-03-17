import { Card } from "antd"
import { useQuery } from "@tanstack/react-query"
import { getOSById } from "@/app/actions/os/curdActions"
const ViewOS = ({ osId }: { osId: number }) => {
  const { data, error, isLoading } = useQuery({
    queryKey: ["os", osId],
    queryFn: () => getOSById(osId),
    enabled: !!osId,
  })
  return (
    <Card title="OS">
      {isLoading && <p>Loading...</p>}
      {error && <p>Error: {error.message}</p>}
      {data && (
        <>
          <p>Name: {data.name}</p>
          <p>Version: {data.version}</p>
          <p>Description: {data.description}</p>
          <p>EOL Date: {data.EOLDate.toDateString()}</p>

        </>
      )}
    </Card>
  )
}

export default ViewOS
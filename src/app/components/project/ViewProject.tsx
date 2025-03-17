import { Card } from "antd"
import { useQuery } from "@tanstack/react-query"
import { getProjectById } from "@/app/actions/projects/crudActions"

const ViewProject = ({projectId}: { projectId: number }) => {
  const { data, error, isLoading } = useQuery({
    queryKey: ["project", projectId],
    queryFn: () => getProjectById(projectId),
    enabled: !!projectId,
  })
  return (
    <Card title="Project">
      {isLoading && <p>Loading...</p>}
      {error && <p>Error: {error.message}</p>}
      {data && (
        <>
          <p>Name: {data.name}</p>
          <p>Description: {data.description}</p>
          <p>Business: {data.business}</p>
          <p>Code: {data.code}</p>
        </>
      )}
    </Card>
  )
}

export default ViewProject
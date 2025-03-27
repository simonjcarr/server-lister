import { Card } from "antd"
import { useQuery } from "@tanstack/react-query"
import { getProjectById } from "@/app/actions/projects/crudActions"
import ClickToCopy from "../utils/ClickToCopy"

const ViewProject = ({projectId}: { projectId: number }) => {
  const { data, error, isLoading } = useQuery({
    queryKey: ["project", projectId],
    queryFn: () => getProjectById(projectId),
    enabled: !!projectId,
  })
  return (
    <Card 
    title={`Project: ${data?.name} | Business: ${data?.businessName}`} 
    extra={(
    <div className="flex items-center gap-2">
      <div className="text-gray-600 text-sm">Project Code:</div>
      <ClickToCopy text={data?.code ?? ""} />
      </div>
    )}>
      {isLoading && <p>Loading...</p>}
      {error && <p>Error: {error.message}</p>}
      {data && (
        <>
          <div className="text-gray-600 text-sm pb-2 mb-2 border-b border-gray-700">{data.description}</div>
          
        </>
      )}
    </Card>
  )
}

export default ViewProject
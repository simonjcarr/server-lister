import { Card, Tabs } from "antd"
import { useQuery } from "@tanstack/react-query"
import { getProjectById } from "@/app/actions/projects/crudActions"
import ClickToCopy from "../utils/ClickToCopy"
import type { TabsProps } from "antd"
import ProjectTab from "./projectTabs/projectTab/ProjectTab"
import PrimaryEngineerTab from "./projectTabs/primaryEngineerTab/PrimaryEngineerTab"

const ViewProject = ({projectId}: { projectId: number }) => {
  const { data, error, isLoading } = useQuery({
    queryKey: ["project", projectId],
    queryFn: () => getProjectById(projectId),
    enabled: !!projectId,
    staleTime: 60 * 1000
  })
  const items: TabsProps['items'] = [
    {
      key: "0",
      label: "Project",
      children: <ProjectTab projectId={projectId} />,
    },
    {
      key: "1",
      label: "Primary Engineers",
      children: <PrimaryEngineerTab projectId={projectId} />,
    },
    {
      key: "2",
      label: "Drawings",
      // children: <ViewBusiness businessId={data?.businessId ?? 0} />,
    },
    {
      key: "3",
      label: "Links",
      // children: <ViewBusiness businessId={data?.businessId ?? 0} />,
    },
  ]
  return (
    <Card 
    title={`Project: ${data?.name} | Business: ${data?.businessName}`} 
    extra={(
    <div className="flex items-center gap-2">
      <div className="text-gray-600 text-sm">Booking Code:</div>
      <ClickToCopy text={data?.code ?? ""} />
      </div>
    )}>
      {isLoading && <p>Loading...</p>}
      {error && <p>Error: {error.message}</p>}
      {data && (
        <>
          <Tabs className="max-h-[90vh]" tabPosition="top" items={items} defaultActiveKey="0" />
          
          
        </>
      )}
    </Card>
  )
}

export default ViewProject
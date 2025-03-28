"use client"
import { Card, Tabs } from "antd"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { createProjectDrawing, getProjectById, getProjectDrawings } from "@/app/actions/projects/crudActions"
import ClickToCopy from "../utils/ClickToCopy"
import type { TabsProps } from "antd"
import ProjectTab from "./projectTabs/projectTab/ProjectTab"
import PrimaryEngineerTab from "./projectTabs/primaryEngineerTab/PrimaryEngineerTab"
import DrawingsComponent from "../drawing/DrawingsComponent"
import { SelectDrawing } from "@/db/schema"

const ViewProject = ({ projectId }: { projectId: number }) => {
  const queryClient = useQueryClient()
  const { data, error, isLoading } = useQuery({
    queryKey: ["project", projectId],
    queryFn: () => getProjectById(projectId),
    enabled: !!projectId,
    staleTime: 60 * 1000
  })

  const { data: drawings } = useQuery({
    queryKey: ["project", "drawings", projectId],
    queryFn: () => getProjectDrawings(projectId),
    enabled: !!projectId,
  })

  const mutation = useMutation({
    mutationFn: (drawingId: number) => createProjectDrawing(drawingId, projectId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project", "drawings", projectId]})
    }
  })

  const drawingUpdated = (drawing: SelectDrawing) => {
    mutation.mutate(drawing.id)
  }
    
  

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
      children: <DrawingsComponent drawingsAvailable={drawings || []} drawingId={null} drawingUpdated={drawingUpdated} />,
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

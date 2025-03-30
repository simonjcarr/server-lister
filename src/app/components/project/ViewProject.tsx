"use client"
import { Card, Tabs, Dropdown, message, Modal, App } from "antd"
import { EllipsisOutlined } from "@ant-design/icons"
import { useRouter } from "next/navigation"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { createProjectDrawing, getProjectById, getProjectDrawingIds, deleteProject } from "@/app/actions/projects/crudActions"
import ClickToCopy from "../utils/ClickToCopy"
import ProjectBookingCodeDisplay from "../bookingCode/ProjectBookingCodeDisplay"
import type { TabsProps } from "antd"
import ProjectTab from "./projectTabs/projectTab/ProjectTab"
import PrimaryEngineerTab from "./projectTabs/primaryEngineerTab/PrimaryEngineerTab"
import DrawingsComponent from "../drawing/DrawingsComponent"
import { SelectDrawing } from "@/db/schema"

const ViewProject = ({ projectId }: { projectId: number }) => {
  const queryClient = useQueryClient()
  const router = useRouter()
  const { message, modal } = App.useApp()
  const { data, error, isLoading } = useQuery({
    queryKey: ["project", projectId],
    queryFn: () => getProjectById(projectId),
    enabled: !!projectId,
    staleTime: 60 * 1000
  })

  const { data: drawingIds = [] } = useQuery({
    queryKey: ["project", "drawingIds", projectId],
    queryFn: () => getProjectDrawingIds(projectId),
    enabled: !!projectId,
  })

  const mutation = useMutation({
    mutationFn: (drawingId: number) => createProjectDrawing(drawingId, projectId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project", "drawingIds", projectId]})
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
      children: <DrawingsComponent drawingIds={drawingIds} drawingId={null} drawingUpdated={drawingUpdated} />,
    },
    {
      key: "3",
      label: "Links",
      // children: <ViewBusiness businessId={data?.businessId ?? 0} />,
    },
  ]
  const handleEdit = () => {
    router.push(`/project/edit/${projectId}`)
  }

  const handleDelete = () => {
    modal.confirm({
      title: 'Confirm Delete',
      content: `Are you sure you want to delete project "${data?.name}"? This action cannot be undone.`,
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          const result = await deleteProject(projectId)
          if (result.success) {
            message.success('Project deleted successfully')
            router.push('/project/list')
          } else {
            message.error(`Failed to delete project: ${result.error}`)
          }
        } catch (error) {
          message.error(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
      }
    })
  }

  const dropdownItems = [
    {
      key: 'edit',
      label: 'Edit',
      onClick: handleEdit,
    },
    {
      key: 'delete',
      label: 'Delete',
      onClick: handleDelete,
      danger: true,
    },
  ]

  return (
    <>
      <Card
        title={`Project: ${data?.name}${data?.businessName ? ` | Business: ${data?.businessName}` : ''}`}
        extra={(
          <div className="flex items-center gap-2">
            <div className="text-gray-600 text-sm">Project Code:</div>
            <ClickToCopy text={data?.code ?? ""} />
            <Dropdown menu={{ items: dropdownItems }} placement="bottomRight">
              <EllipsisOutlined className="ml-2 cursor-pointer text-xl" />
            </Dropdown>
          </div>
        )}>
      {isLoading && <p>Loading...</p>}
      {error && <p>Error: {error.message}</p>}
      {data && (
        <>
          <ProjectBookingCodeDisplay projectId={projectId} />
          <Tabs className="max-h-[90vh]" tabPosition="top" items={items} defaultActiveKey="0" />
        </>
      )}
      </Card>
    </>
  )
}

export default ViewProject

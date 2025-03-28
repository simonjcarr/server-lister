import { Alert, Button, Card, Spin } from "antd"
import NewDrawing from "./NewDrawing"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useEffect, useState } from "react"
import OpenDrawing from "./OpenDrawing"
import { getProjectDrawing } from "@/app/actions/projects/crudActions"
import DrawIOEmbed from "../../drawio/DrawIO"



const ProjectDrawingsTab = ({projectId}: {projectId: number}) => {
  const queryClient = useQueryClient()
  const [openDrawingId, setOpenDrawingId] = useState<number | null>(null)
  const [cardTitle, setCardTitle] = useState<string | null>(null)
  const {data, error, isLoading} = useQuery({
    queryKey: ["projectDrawing", projectId],
    queryFn: () => getProjectDrawing(openDrawingId || 0),
    staleTime: 60 * 1000,
    enabled: !!openDrawingId
  })
  const drawingSelected = (id: number) => {
    queryClient.invalidateQueries({ queryKey: ["projectDrawing", projectId] })
    setOpenDrawingId(id)
    console.log(id)
  }

  useEffect(() => {
    if(!openDrawingId) return
    setCardTitle(data?.name || "")
  }, [openDrawingId, data])

  const onLoad = () => {
    console.log('Drawing loaded')
  }

  const onSave = (xml: string) => {
    console.log('Drawing saved', xml)
  }

  return (
    <Card title={cardTitle || <OpenDrawing projectId={projectId} drawingSelected={drawingSelected}><Button type="default">Open Drawing</Button></OpenDrawing>} extra={<NewDrawing projectId={projectId} drawingSelected={drawingSelected}><Button type="default">New Drawing</Button></NewDrawing>}>
      {isLoading && <Spin />}
      {error && <Alert message="Error loading drawing" type="error" />}
      {data && <DrawIOEmbed onLoad={onLoad} onSave={onSave} initialDiagramXml={data.xml} />}
    </Card>
  )
}

export default ProjectDrawingsTab
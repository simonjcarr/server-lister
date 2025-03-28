import { Alert, Button, Card, Spin } from "antd"
import NewDrawing from "./NewDrawing"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useEffect, useState } from "react"
import OpenDrawing from "./OpenDrawing"
import { getProjectDrawing,  updateProjectDrawingXML } from "@/app/actions/projects/crudActions"
import DrawIOEmbed from "../../drawio/DrawIO"




const ProjectDrawingsTab = ({projectId}: {projectId: number}) => {
  const queryClient = useQueryClient()
  const [openDrawingId, setOpenDrawingId] = useState<number | null>(null)
  const [initialXml, setInitialXml] = useState<string | null>(null)
  const [cardTitle, setCardTitle] = useState<string | null>(null)
  const {data, error, isLoading} = useQuery({
    queryKey: ["projectDrawing", projectId],
    queryFn: () => getProjectDrawing(openDrawingId || 0),
    staleTime: 60 * 1000,
    enabled: !!openDrawingId
  })

  const mutate = useMutation({
    mutationFn: async (xml: string) => {
      return await updateProjectDrawingXML(openDrawingId || 0, xml)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projectDrawing", projectId] })
    }
  })
  const drawingSelected = (id: number) => {
    setOpenDrawingId(id)
    setInitialXml(null)
    setCardTitle(null)
    queryClient.invalidateQueries({ queryKey: ["projectDrawing", projectId] })
    
    console.log(id)
  }

  useEffect(() => {
    if(!openDrawingId) return
    setCardTitle(data?.name || "")
    setInitialXml(data?.xml || null)
  }, [openDrawingId, data])

  const onLoad = () => {
    console.log('Drawing loaded')
    return initialXml || ""
  }

  const onSave = (xml: string) => {
    console.log('Drawing saved', xml)
    mutate.mutate(xml)
  }

  return (
    <Card title={cardTitle || <OpenDrawing projectId={projectId} drawingSelected={drawingSelected}><Button type="default">Open Drawing</Button></OpenDrawing>} extra={<NewDrawing projectId={projectId} drawingSelected={drawingSelected}><Button type="default">New Drawing</Button></NewDrawing>}>
      {isLoading && <Spin />}
      {error && <Alert message="Error loading drawing" type="error" />}
      {data && !!openDrawingId && initialXml && <DrawIOEmbed onLoad={onLoad} onSave={onSave} initialDiagramXml={initialXml || ""} />}
    </Card>
  )
}

export default ProjectDrawingsTab
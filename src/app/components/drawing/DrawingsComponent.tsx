import { Alert, Button, Card, Spin } from "antd"
import NewDrawing from "./NewDrawing"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useEffect, useState } from "react"
import OpenDrawing from "./OpenDrawing"
import { updateDrawingXML, getDrawing } from "@/app/actions/drawings/crudDrawings"
import DrawIOEmbed from "./DrawIO"
import { SelectDrawing } from "@/db/schema"




const DrawingsComponent = ({ drawingsAvailable, drawingId, drawingUpdated }: {  drawingsAvailable: SelectDrawing[], drawingId: number | null, drawingUpdated: (drawing: SelectDrawing) => void }) => {
  const queryClient = useQueryClient()
  const [openDrawingId, setOpenDrawingId] = useState<number | null>(null)
  const [initialXml, setInitialXml] = useState<string | null>(null)
  const [cardTitle, setCardTitle] = useState<string | null>(null)

  const { data, error, isLoading } = useQuery({
    queryKey: ["drawing", drawingId],
    queryFn: () => getDrawing(drawingId || 0),
    staleTime: 60 * 1000,
    enabled: !!drawingId
  })

  const mutate = useMutation({
    mutationFn: async (xml: string) => {
      if (!drawingId) return
      return await updateDrawingXML(drawingId, xml)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["drawing", drawingId] })
    }
  })
  const drawingSelected = (id: number) => {
    setOpenDrawingId(id)
    setInitialXml(null)
    setCardTitle(null)
    queryClient.invalidateQueries({ queryKey: ["drawing", id] })

    console.log(id)
  }

  useEffect(() => {
    if (!openDrawingId) return
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

  const closeDrawing = () => {
    setOpenDrawingId(null)
    setInitialXml(null)
    setCardTitle(null)
  }

  return (
    <Card title={
      cardTitle ||
      <OpenDrawing drawingsAvailable={drawingsAvailable} drawingSelected={drawingSelected}>
        <Button type="default">Open Drawing</Button>
      </OpenDrawing>}
      extra={
        <>
          {!openDrawingId && <NewDrawing drawingUpdated={drawingUpdated}><Button type="default">New Drawing</Button></NewDrawing>}
          {openDrawingId && <Button type="default" onClick={closeDrawing}>Close Drawing</Button>}
        </>
      }>
      {isLoading && <Spin />}
      {error && <Alert message="Error loading drawing" type="error" />}
      {data && !!openDrawingId && initialXml && <DrawIOEmbed onLoad={onLoad} onSave={onSave} initialDiagramXml={initialXml || ""} />}
      {data && !!openDrawingId && !initialXml && <DrawIOEmbed onLoad={onLoad} onSave={onSave} initialDiagramXml={initialXml || ""} />}
    </Card>
  )
}

export default DrawingsComponent
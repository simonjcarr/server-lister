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
  const [openDrawingId, setOpenDrawingId] = useState<number | null>(drawingId)
  const [initialXml, setInitialXml] = useState<string | null>(null)
  const [cardTitle, setCardTitle] = useState<string | null>(null)

  const findSelectedDrawing = () => {
    const id = openDrawingId || drawingId
    if (!id || !drawingsAvailable) return null
    return drawingsAvailable.find(drawing => drawing.id === id)
  }

  const { data, error, isLoading } = useQuery({
    queryKey: ["drawing", openDrawingId],
    queryFn: async () => {
      if (!openDrawingId) return null
      console.log("Fetching drawing data for ID:", openDrawingId)
      try {
        const result = await getDrawing(openDrawingId)
        console.log("Query result:", result)
        return result
      } catch (err) {
        console.error("Error fetching drawing:", err)
        return null
      }
    },
    enabled: !!openDrawingId
  })

  const mutate = useMutation({
    mutationFn: async (xml: string) => {
      if (!openDrawingId) return
      return await updateDrawingXML(openDrawingId, xml)
    },
    onSuccess: (updatedDrawing) => {
      console.log("Drawing updated successfully:", updatedDrawing)
      queryClient.invalidateQueries({ queryKey: ["drawing", openDrawingId] })
      if (updatedDrawing) {
        drawingUpdated(updatedDrawing as SelectDrawing)
      }
    }
  })

  const drawingSelected = (id: number) => {
    console.log("Drawing selected with id:", id)
    const selectedDrawing = drawingsAvailable.find(d => d.id === id)
    if (selectedDrawing) {
      console.log("Found drawing in available list:", selectedDrawing.name)
      setCardTitle(selectedDrawing.name)
    }
    setOpenDrawingId(id)
    setInitialXml(null)
    queryClient.invalidateQueries({ queryKey: ["drawing", id] })
  }

  useEffect(() => {
    console.log("Data from query changed:", data)
    if (data?.name) {
      console.log("Setting card title from query data to", data.name)
      setCardTitle(data.name)
    }
    if (data?.xml) {
      setInitialXml(data.xml)
    }
  }, [data])

  useEffect(() => {
    if (drawingId && drawingId !== openDrawingId) {
      console.log("Drawing ID changed from props:", drawingId)
      setOpenDrawingId(drawingId)
      const selected = drawingsAvailable.find(d => d.id === drawingId)
      if (selected?.name) {
        console.log("Setting title from available drawings:", selected.name)
        setCardTitle(selected.name)
      }
    }
  }, [drawingId, drawingsAvailable, openDrawingId])

  const onLoad = () => {
    console.log("onLoad", data?.name, "initialXml length:", initialXml?.length || 0)
    return initialXml || ""
  }

  const onSave = (xml: string) => {
    console.log("Saving drawing", openDrawingId)
    mutate.mutate(xml)
  }

  const closeDrawing = () => {
    setOpenDrawingId(null)
    setInitialXml(null)
    setCardTitle(null)
  }

  const currentTitle = cardTitle || findSelectedDrawing()?.name || null
  console.log("Current title:", currentTitle, "openDrawingId:", openDrawingId, "cardTitle:", cardTitle)

  return (
    <Card title={
      currentTitle ||
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
      {drawingsAvailable && !!openDrawingId && initialXml && <DrawIOEmbed onLoad={onLoad} onSave={onSave} drawingId={openDrawingId} />}
      {drawingsAvailable && !!openDrawingId && !initialXml && data && <DrawIOEmbed onLoad={onLoad} onSave={onSave} drawingId={openDrawingId} />}
    </Card>
  )
}

export default DrawingsComponent
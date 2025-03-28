import { Alert, Button, Card, Spin } from "antd"
import NewDrawing from "./NewDrawing"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useEffect, useState, useRef } from "react"
import OpenDrawing from "./OpenDrawing"
import EditDrawing from "./EditDrawing"
import { updateDrawingXML, updateDrawingWebp, getDrawing, getDrawingsByIds } from "@/app/actions/drawings/crudDrawings"
import DrawIOEmbed from "./DrawIO"
import { SelectDrawing } from "@/db/schema"
import { EditOutlined } from "@ant-design/icons"

const DrawingsComponent = ({ drawingIds, drawingId, drawingUpdated }: { drawingIds: number[], drawingId: number | null, drawingUpdated: (drawing: SelectDrawing) => void }) => {
  const queryClient = useQueryClient()
  const [openDrawingId, setOpenDrawingId] = useState<number | null>(drawingId)
  const [initialXml, setInitialXml] = useState<string | null>(null)
  const [cardTitle, setCardTitle] = useState<string | null>(null)

  // Fetch all drawings by their IDs
  const { data: drawingsAvailable = [], isLoading: isLoadingDrawings } = useQuery({
    queryKey: ["drawings", drawingIds],
    queryFn: async () => {
      try {
        return await getDrawingsByIds(drawingIds)
      } catch (error) {
        console.error("Error fetching drawings:", error)
        return []
      }
    },
    enabled: drawingIds.length > 0
  })
  
  const findSelectedDrawing = () => {
    const id = openDrawingId || drawingId
    if (!id || !drawingsAvailable.length) return null
    return drawingsAvailable.find(drawing => drawing.id === id)
  }

  const { data, error, isLoading: isLoadingSingleDrawing } = useQuery({
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
      // Invalidate the query for the individual drawing
      queryClient.invalidateQueries({ queryKey: ["drawing", openDrawingId] })
      // Invalidate the query that fetches all drawings by IDs to update the list
      queryClient.invalidateQueries({ queryKey: ["drawings", drawingIds] })
      if (updatedDrawing) {
        drawingUpdated(updatedDrawing as SelectDrawing)
      }
    }
  })

  const webpMutate = useMutation({
    mutationFn: async (webp: string) => {
      if (!openDrawingId) return
      return await updateDrawingWebp(openDrawingId, webp)
    },
    onSuccess: (updatedDrawing) => {
      console.log("Drawing WebP updated successfully", updatedDrawing)
      // No need to invalidate queries as the WebP doesn't affect the UI
    }
  })

  const drawingSelected = (id: number) => {
    console.log("Drawing selected with id:", id)
    // Clear state first before changing the drawing
    setInitialXml(null)
    
    const selectedDrawing = drawingsAvailable.find(d => d.id === id)
    if (selectedDrawing) {
      console.log("Found drawing in available list:", selectedDrawing.name)
      setCardTitle(selectedDrawing.name)
    }
    
    // Invalidate queries before changing the ID to ensure proper fetch
    queryClient.invalidateQueries({ queryKey: ["drawing", id] })
    
    // Then set the new drawing ID
    setOpenDrawingId(id)
  }

  useEffect(() => {
    console.log("Data from query changed:", data)
    if (data?.name) {
      console.log("Setting card title from query data to", data.name)
      setCardTitle(data.name)
    }
    if (data?.xml) {
      console.log("Setting initialXml from query data, length:", data.xml.length)
      setInitialXml(data.xml)
    } else {
      console.log("No XML available in the fetched data")
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

  const onLoad = (): string => {
    console.log("onLoad called", data?.name, "initialXml length:", initialXml?.length || 0)
    // Return the existing XML if available, otherwise an empty string
    // which will cause DrawIO to create a new blank diagram
    if (initialXml) {
      console.log("Returning initialXml from state")
      return initialXml
    }
    console.log("No initialXml available, returning empty string")
    return ""
  }

  const onSave = (xml: string) => {
    console.log("Saving drawing", openDrawingId)
    mutate.mutate(xml)
    // WebP export will be handled by the DrawIOEmbed component's onExport callback
  }

  const onExport = (webpBase64: string) => {
    console.log("WebP export received, length:", webpBase64.length)
    
    // Save the WebP data to the database
    if (webpBase64 && openDrawingId) {
      webpMutate.mutate(webpBase64)
    }
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
      <OpenDrawing drawingsAvailable={drawingsAvailable || []} drawingSelected={drawingSelected}>
        <Button type="default">Open Drawing</Button>
      </OpenDrawing>}
      extra={
        <>
          {!openDrawingId && <NewDrawing drawingUpdated={drawingUpdated}><Button type="default">New Drawing</Button></NewDrawing>}
          {openDrawingId && (
            <>
              <EditDrawing drawing={findSelectedDrawing() || null} drawingUpdated={drawingUpdated}>
                <Button type="default" icon={<EditOutlined />} style={{ marginRight: 8 }}>Edit</Button>
              </EditDrawing>
              <Button type="default" onClick={closeDrawing}>Close Drawing</Button>
            </>
          )}
        </>
      }>
      {(isLoadingDrawings || isLoadingSingleDrawing) && <Spin />}
      {error && <Alert message="Error loading drawing" type="error" />}
      {!!openDrawingId && !isLoadingSingleDrawing && (
        <DrawIOEmbed 
          onLoad={onLoad} 
          onSave={onSave} 
          onExport={onExport} 
          drawingId={openDrawingId} 
        />
      )}
    </Card>
  )
}

export default DrawingsComponent
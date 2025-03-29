import React from "react"
import { Alert, Button, Card, Spin, App, Space, Dropdown } from "antd"
import NewDrawing from "./NewDrawing"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useEffect, useState } from "react"
import OpenDrawing from "./OpenDrawing"
import EditDrawing from "./EditDrawing"
import { updateDrawingXML, updateDrawingWebp, getDrawing, getDrawingsByIds, deleteDrawing } from "@/app/actions/drawings/crudDrawings"
import DrawIOEmbed from "./DrawIO"
import { SelectDrawing } from "@/db/schema"
import { EditOutlined, DeleteOutlined, EllipsisOutlined, SettingOutlined, CloseOutlined, FolderOpenOutlined, PlusOutlined } from "@ant-design/icons"
import DrawingPreview from "./DrawingPreview"

const DrawingsComponent = ({ drawingIds, drawingId, drawingUpdated }: { 
  drawingIds: number[], 
  drawingId: number | null, 
  drawingUpdated: (drawing: SelectDrawing) => void 
}) => {
  const { message } = App.useApp();
  const queryClient = useQueryClient()
  const [openDrawingId, setOpenDrawingId] = useState<number | null>(drawingId)
  const [initialXml, setInitialXml] = useState<string | null>(null)
  const [cardTitle, setCardTitle] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)

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
      try {
        const result = await getDrawing(openDrawingId)
        return result
      } catch (err) {
        console.error("Error fetching drawing:", err)
        return null
      }
    },
    enabled: !!openDrawingId
  })

  // Listen for custom event to open a specific drawing
  useEffect(() => {
    const handleOpenDrawing = (event: CustomEvent<{ drawingId: number }>) => {
      const { drawingId } = event.detail;
      if (drawingId && drawingsAvailable.length > 0) {
        // Find the drawing in the available drawings and open it
        drawingSelected(drawingId);
      }
    };

    // Add event listener
    document.addEventListener('openDrawing', handleOpenDrawing as EventListener);

    // Clean up
    return () => {
      document.removeEventListener('openDrawing', handleOpenDrawing as EventListener);
    };
  }, [drawingIds, drawingsAvailable]);

  // Reference for the Edit Drawing button click
  const [triggerEditDrawing, setTriggerEditDrawing] = useState<boolean>(false);

  const deleteMutation = useMutation({
    mutationFn: async (drawingId: number) => {
      return await deleteDrawing(drawingId)
    },
    onSuccess: (deletedDrawing) => {
      // Invalidate queries to update the UI
      queryClient.invalidateQueries({ queryKey: ["drawings", drawingIds] })
      
      // Close the drawing preview since it's been deleted
      setOpenDrawingId(null)
      setInitialXml(null)
      setCardTitle(null)
      setIsEditing(false)
      
      // Show success message
      message.success(`Drawing "${deletedDrawing?.name || 'Drawing'}" has been deleted`)
      
      // Notify parent component that a drawing was updated (deleted in this case)
      if (deletedDrawing) {
        // Use null as ID to indicate deletion
        const notificationDrawing = { ...deletedDrawing, id: -1 } as SelectDrawing
        drawingUpdated(notificationDrawing)
      }
    },
    onError: (error) => {
      console.error("Error deleting drawing:", error)
      message.error("Failed to delete drawing. Please try again.")
    }
  })

  // State to control the visibility of the EditDrawing modal
  // const [showEditDrawingModal, setShowEditDrawingModal] = useState(false);

  const mutate = useMutation({
    mutationFn: async (xml: string) => {
      if (!openDrawingId) return
      return await updateDrawingXML(openDrawingId, xml)
    },
    onSuccess: (updatedDrawing) => {
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
    mutationFn: async (base64Data: string) => {
      if (!openDrawingId) return
      return await updateDrawingWebp(openDrawingId, base64Data)
    },
    onSuccess: (updatedDrawing) => {
      // Invalidate the queries to update the UI with the new image
      queryClient.invalidateQueries({ queryKey: ["drawings", drawingIds] })
      queryClient.invalidateQueries({ queryKey: ["drawing", openDrawingId] })
      if (updatedDrawing) {
        drawingUpdated(updatedDrawing as SelectDrawing)
      }
    }
  })

  const drawingSelected = (id: number) => {
    // Clear state first before changing the drawing
    setInitialXml(null)
    setIsEditing(false)
    
    const selectedDrawing = drawingsAvailable.find(d => d.id === id)
    if (selectedDrawing) {
      setCardTitle(selectedDrawing.name)
    }
    
    // Invalidate queries before changing the ID to ensure proper fetch
    queryClient.invalidateQueries({ queryKey: ["drawing", id] })
    
    // Then set the new drawing ID
    setOpenDrawingId(id)
  }

  useEffect(() => {
    if (data?.name) {
      setCardTitle(data.name)
    }
    if (data?.xml) {
      setInitialXml(data.xml)
    } else {
      setInitialXml(null)
    }
  }, [data])

  useEffect(() => {
    if (drawingId && drawingId !== openDrawingId) {
      setOpenDrawingId(drawingId)
      setIsEditing(false)
      const selected = drawingsAvailable.find(d => d.id === drawingId)
      if (selected?.name) {
        setCardTitle(selected.name)
      }
    }
  }, [drawingId, drawingsAvailable, openDrawingId])

  const onLoad = (): string => {
    if (initialXml) {
      return initialXml
    }
    return ""
  }

  const onSave = (xml: string) => {
    mutate.mutate(xml)
  }

  const onExport = (base64Data: string) => {
    if (base64Data && openDrawingId) {
      webpMutate.mutate(base64Data)
    }
  }

  const closeDrawing = () => {
    setOpenDrawingId(null)
    setInitialXml(null)
    setCardTitle(null)
    setIsEditing(false)
  }

  const handleEditDrawing = () => {
    setIsEditing(true)
  }

  const currentTitle = cardTitle || findSelectedDrawing()?.name || null
  const selectedDrawing = openDrawingId ? (data || findSelectedDrawing()) : null

  return (
    <>
    <Card 
      title={
        currentTitle ||
        <OpenDrawing 
          drawingsAvailable={drawingsAvailable || []} 
          drawingSelected={drawingSelected}
        >
          <Button type="default" icon={<FolderOpenOutlined />}>Open Drawing</Button>
        </OpenDrawing>
      }
      extra={
        <>
          {!openDrawingId && 
            <NewDrawing drawingUpdated={drawingUpdated}>
              <Button type="default" icon={<PlusOutlined />}>New Drawing</Button>
            </NewDrawing>
          }
          {openDrawingId && !isEditing && (
            <Dropdown
              menu={{
                items: [
                  {
                    key: 'properties',
                    icon: <SettingOutlined />,
                    label: 'Properties',
                    onClick: () => setTriggerEditDrawing(prev => !prev)
                  },
                  {
                    key: 'edit',
                    icon: <EditOutlined />,
                    label: 'Edit Drawing',
                    onClick: handleEditDrawing
                  },
                  {
                    key: 'delete',
                    icon: <DeleteOutlined />,
                    label: 'Delete',
                    danger: true,
                    onClick: () => {
                      // First confirm before deletion
                      if (window.confirm('Are you sure you want to delete this drawing? This action cannot be undone.')) {
                        deleteMutation.mutate(openDrawingId);
                      }
                    }
                  },
                  {
                    key: 'close',
                    icon: <CloseOutlined />,
                    label: 'Close',
                    onClick: closeDrawing
                  },
                ],
              }}
              placement="bottomRight"
              trigger={['click']}
            >
              <Button icon={<EllipsisOutlined />}>Actions</Button>
            </Dropdown>
          )}
          {openDrawingId && isEditing && (
            <Space>
              <Button 
                type="default" 
                onClick={() => setIsEditing(false)}
                icon={<EditOutlined />}
              >
                Back to Preview
              </Button>
              <Button type="default" onClick={closeDrawing} icon={<CloseOutlined />}>
                Close Drawing
              </Button>
            </Space>
          )}
        </>
      }
    >
      {(isLoadingDrawings || isLoadingSingleDrawing) && <Spin />}
      {error && <Alert message="Error loading drawing" type="error" />}
      
      {!!openDrawingId && !isLoadingSingleDrawing && !isEditing && (
        <DrawingPreview 
          drawing={selectedDrawing || null}
          onEdit={handleEditDrawing}
          onClose={closeDrawing}
        />
      )}
      
      {!!openDrawingId && !isLoadingSingleDrawing && isEditing && (
        <DrawIOEmbed 
          onLoad={onLoad} 
          onSave={onSave} 
          onExport={onExport} 
          drawingId={openDrawingId} 
        />
      )}
    </Card>

    {/* Hidden button to trigger EditDrawing modal */}
    <div style={{ display: 'none' }}>
      <EditDrawing
        drawing={findSelectedDrawing() || null}
        drawingUpdated={(drawing) => {
          drawingUpdated(drawing);
        }}
      >
        <button onClick={() => {}} ref={(btn) => {
          // When triggerEditDrawing changes, simulate a click on this button
          if (btn && triggerEditDrawing) {
            btn.click();
            // Reset the trigger after use
            setTriggerEditDrawing(false);
          }
        }}>
          Properties
        </button>
      </EditDrawing>
    </div>
    </>
  )
}

export default DrawingsComponent
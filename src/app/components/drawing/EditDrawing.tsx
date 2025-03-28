"use client"
import { Drawer, Form, Input, Button, Select, Spin, Divider } from "antd"
import { useState, useEffect } from "react"
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query"
import { updateDrawing } from "@/app/actions/drawings/crudDrawings"
import { getAllServers, getDrawingServerIds, updateDrawingServers } from "@/app/actions/drawings/serverDrawings/serverDrawingActions"
import { SelectDrawing } from "@/db/schema"

const EditDrawing = ({
  children,
  drawing,
  drawingUpdated
}: {
  children: React.ReactNode,
  drawing: SelectDrawing | null,
  drawingUpdated: (drawing: SelectDrawing) => void
}) => {
  const [open, setOpen] = useState(false)
  const [form] = Form.useForm()
  const queryClient = useQueryClient()
  const [selectedServerIds, setSelectedServerIds] = useState<number[]>([])

  // Query to fetch all available servers for selection
  const { data: serversData, isLoading: serversLoading } = useQuery({
    queryKey: ['servers-for-selection'],
    queryFn: getAllServers,
    enabled: open
  })

  // Query to fetch server IDs currently linked to this drawing
  const { data: linkedServerIds, isLoading: linkedServersLoading } = useQuery({
    queryKey: ['drawing-server-ids', drawing?.id],
    queryFn: () => drawing ? getDrawingServerIds(drawing.id) : Promise.resolve([]),
    enabled: !!drawing && open
  })

  useEffect(() => {
    if (drawing && open) {
      // Reset form with current drawing data when drawer opens
      form.setFieldsValue({
        name: drawing.name,
        description: drawing.description
      })
    }
  }, [drawing, form, open])
  
  useEffect(() => {
    if (linkedServerIds) {
      setSelectedServerIds(linkedServerIds)
    }
  }, [linkedServerIds])

  // Mutation for updating drawing properties
  const mutation = useMutation({
    mutationFn: async (values: { name: string; description: string | null }) => {
      if (!drawing) return null

      return await updateDrawing(drawing.id, {
        name: values.name,
        description: values.description,
        // We need to keep the existing values for these fields
        xml: drawing.xml,
        svg: drawing.svg,
        // Include the date fields required by InsertDrawing type
        createdAt: drawing.createdAt,
        updatedAt: new Date()
      })
    },
    onSuccess: async (data) => {
      if (data) {
        // After drawing is updated, update server associations
        if (!drawing) {
          console.error("Drawing not found when updating server associations")
          return
        }
        await serversMutation.mutateAsync(drawing.id)
      }
    }
  })

  // Mutation for updating server associations
  const serversMutation = useMutation({
    mutationFn: async (drawingId: number) => {
      return await updateDrawingServers(drawingId, selectedServerIds)
    },
    onSuccess: () => {
      setOpen(false)
      if (drawing) {
        drawingUpdated(drawing)
      }
      // Invalidate specific drawing query
      queryClient.invalidateQueries({ queryKey: ["drawing", drawing?.id] })
      
      // Also invalidate related queries
      queryClient.invalidateQueries({ queryKey: ["drawings"] })
      queryClient.invalidateQueries({ queryKey: ["drawing-server-ids", drawing?.id] })
    }
  })

  const handleUpdate = async (values: { name: string; description: string | null }) => {
    await mutation.mutateAsync(values)
  }

  if (!drawing) return null

  return (
    <>
      <span onClick={() => setOpen(true)}>{children}</span>
      <Drawer
        title="Edit Drawing"
        open={open}
        onClose={() => setOpen(false)}
        footer={null}
        placement="right"
        extra={
          <Button type="default" onClick={() => setOpen(false)}>Cancel</Button>
        }
        destroyOnClose
      >
        <div className="text-gray-600 text-sm mb-2">Edit drawing properties</div>
        <Form 
          form={form}
          onFinish={handleUpdate} 
          layout="vertical"
          initialValues={{
            name: drawing.name,
            description: drawing.description
          }}
        >
          <Form.Item 
            name="name" 
            label="Drawing Name" 
            rules={[{ required: true, message: "Please enter a name for the drawing" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input.TextArea />
          </Form.Item>
          
          <Divider>Associated Servers</Divider>
          
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Link Servers to Drawing</label>
            {(serversLoading || linkedServersLoading) ? (
              <div className="flex justify-center items-center py-4">
                <Spin size="small" /> <span className="ml-2">Loading servers...</span>
              </div>
            ) : (
              <Select
                mode="multiple"
                placeholder="Select servers to associate with this drawing"
                style={{ width: '100%' }}
                value={selectedServerIds}
                onChange={(values) => setSelectedServerIds(values)}
                optionFilterProp="label"
                options={serversData?.map(server => ({
                  value: server.id,
                  label: (
                    <div>
                      <div className="font-medium">{server.hostname}</div>
                      {server.ipv4 && <div className="text-xs text-gray-500">{server.ipv4}</div>}
                      {server.description && <div className="text-xs text-gray-500">{server.description}</div>}
                    </div>
                  )
                }))}
                optionRender={(option) => option.label}
              />
            )}
            <div className="text-xs text-gray-500 mt-1">
              Select multiple servers that should be associated with this diagram
            </div>
          </div>
          
          <Form.Item>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={mutation.isPending || serversMutation.isPending}
            >
              Save Changes
            </Button>
          </Form.Item>
        </Form>
      </Drawer>
    </>
  )
}

export default EditDrawing
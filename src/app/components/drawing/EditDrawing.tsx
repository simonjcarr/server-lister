"use client"
import { Drawer, Form, Input, Button } from "antd"
import { useState, useEffect } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { updateDrawing } from "@/app/actions/drawings/crudDrawings"
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

  useEffect(() => {
    if (drawing && open) {
      // Reset form with current drawing data when drawer opens
      form.setFieldsValue({
        name: drawing.name,
        description: drawing.description
      })
    }
  }, [drawing, form, open])

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
    onSuccess: (data) => {
      if (data) {
        setOpen(false)
        drawingUpdated(data)
        queryClient.invalidateQueries({ queryKey: ["drawing", drawing?.id] })
      }
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
          <Form.Item>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={mutation.isPending}
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
"use client"
import { Drawer, Form, Input, Button } from "antd"
import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { createDrawing } from "@/app/actions/drawings/crudDrawings"
import { InsertDrawing, SelectDrawing } from "@/db/schema"
const NewDrawing = ({children, drawingUpdated}: {children: React.ReactNode, drawingUpdated: (drawing: SelectDrawing) => void}) => {
  const [open, setOpen] = useState(false)
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: async (formData: InsertDrawing) => {
      return await createDrawing(formData)
    },
    onSuccess: (data) => {
      setOpen(false)
      drawingUpdated(data)
      // Invalidate the drawings list query to update it with the new drawing
      queryClient.invalidateQueries({ queryKey: ["drawings"] })
    }
  })
  const handleCreate = async (formData: InsertDrawing) => {
    await mutation.mutateAsync({...formData})
  }
  return (
    <>
    <span onClick={() => setOpen(true)}>{children}</span>
    <Drawer
      title="New Drawing"
      open={open}
      onClose={() => setOpen(false)}
      footer={null}
      placement="right"
      extra={
        <Button type="default" onClick={() => setOpen(false)}>Cancel</Button>
      }
      destroyOnClose
    >
      <div className="text-gray-600 text-sm mb-2">This will create a new empty drawing in the project</div>
      <Form onFinish={handleCreate} layout="vertical">
        <Form.Item name="name" label="Drawing Name" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item name="description" label="Description">
          <Input.TextArea />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit">Create</Button>
        </Form.Item>
      </Form>
    </Drawer>
    </>
  )
}

export default NewDrawing
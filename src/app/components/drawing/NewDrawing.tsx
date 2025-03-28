"use client"
import { Drawer, Form, Input, Button } from "antd"
import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { createDrawing } from "@/app/actions/drawings/crudDrawings"
import { InsertDrawing } from "@/db/schema"
const NewDrawing = ({children, projectId, drawingSelected}: {children: React.ReactNode, projectId: number, drawingSelected?: (id: number) => void}) => {
  const [open, setOpen] = useState(false)
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: async (formData: InsertDrawing) => {
      return await createDrawing(formData)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drawings', projectId] })
      setOpen(false)
    }
  })
  const handleCreate = async (formData: InsertDrawing) => {
    const result = await mutation.mutateAsync({...formData, projectId})
    setOpen(false)
    if (result?.id && drawingSelected) {
      drawingSelected(result.id)
    }
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
        <input type="hidden" name="projectId" value={projectId} />
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
'use client'
import { Button, Drawer, Form, Input } from "antd"
import { useState } from "react"
import { createServerAction } from "@/app/actions/serverActions/crudActions"
import { useMutation, useQueryClient } from "@tanstack/react-query"

const CreateNewServerTaskForm = ({ serverId }: { serverId: number }) => {
  const [open, setOpen] = useState(false)
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: ({ title, description }: { title: string; description: string }) => createServerAction(serverId, title, description),
    onSuccess: () => {
      setOpen(false)
      queryClient.invalidateQueries({ queryKey: ['serverTasks', serverId] })
    }
  })
  const onFinish = (values: { title: string; description: string }) => {
    mutation.mutate(values)
  }
  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Button ghost onClick={() => setOpen(true)}>New Task</Button>
      </div>
      <Drawer
        title="Create new server task"
        placement="right"
        width={400}
        onClose={() => setOpen(false)}
        open={open}
    >
      <div>
        <Form
          layout="vertical"
          onFinish={onFinish}
        >
          <Form.Item
            name="title"
            label="Task Name"
            rules={[{ required: true }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="description"
            label="Description"
          >
            <Input.TextArea />
          </Form.Item>

          <Form.Item className="flex justify-end">
            <Button type="primary" htmlType="submit">Create</Button>
          </Form.Item>
        </Form>
      </div>
    </Drawer>
    </div>
  )
}

export default CreateNewServerTaskForm
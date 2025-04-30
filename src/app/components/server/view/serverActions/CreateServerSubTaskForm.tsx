'use client'
import { Form, Input, Button, Drawer } from 'antd'
import { useState } from 'react'
import { BsListTask } from 'react-icons/bs'
import { useMutation } from '@tanstack/react-query'
import { createSubTask } from '@/app/actions/serverTasks/crudSubTasks'
import { useQueryClient } from '@tanstack/react-query'

const CreateServerSubTaskForm = ({ taskId }: { taskId: number }) => {
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const mutation = useMutation({
    mutationFn: ({ title, description }: { title: string; description: string }) => createSubTask(taskId, title, description),
    onSuccess: () => {
      setOpen(false)
      queryClient.invalidateQueries({ queryKey: ['subTasks', taskId] })
    }
  })

  const handleOnFinish = (values: { title: string; description: string }) => {
    mutation.mutate(values)
  }

  return (
    <>
    <Button size='small' ghost onClick={() => setOpen(true)}><BsListTask />New Sub Task</Button>
    <Drawer title="Create sub task" placement="right" width={400} onClose={() => setOpen(false)} open={open}>
      <Form layout="vertical" onFinish={handleOnFinish}>
        <Form.Item name="title" label="Title" required>
          <Input />
        </Form.Item>
        <Form.Item name="description" label="Description">
          <Input.TextArea />
        </Form.Item>
        <Form.Item >
          <Button type="primary" htmlType="submit">Create</Button>
        </Form.Item>
      </Form>
    </Drawer>
    </>
    
  )
}

export default CreateServerSubTaskForm
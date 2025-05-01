'use client'
import { Form, Input, Button, Drawer } from 'antd'
import { useEffect } from 'react'
import { useMutation } from '@tanstack/react-query'
import { updateSubTask } from '@/app/actions/serverTasks/crudSubTasks'
import { useQueryClient } from '@tanstack/react-query'
import { SubTask } from '@/types'

interface EditServerSubTaskFormProps {
  subTask: SubTask
  open: boolean
  onClose: () => void
  taskId: number
}

const EditServerSubTaskForm = ({ subTask, open, onClose, taskId }: EditServerSubTaskFormProps) => {
  const queryClient = useQueryClient()
  const [form] = Form.useForm()
  const mutation = useMutation({
    mutationFn: (values: { title: string; description: string }) =>
      updateSubTask({ subTaskId: subTask.id, ...values }),
    onSuccess: () => {
      onClose()
      queryClient.invalidateQueries({ queryKey: ['subTasks', taskId] })
    }
  })

  // Pre-fill form when subTask changes
  useEffect(() => {
    form.setFieldsValue({
      title: subTask.title,
      description: subTask.description,
    })
  }, [subTask, form])

  const handleOnFinish = (values: { title: string; description: string }) => {
    mutation.mutate(values)
  }

  return (
    <Drawer destroyOnClose title="Edit sub task" placement="right" width={400} onClose={onClose} open={open}>
      <Form form={form} layout="vertical" onFinish={handleOnFinish} initialValues={{ title: subTask.title, description: subTask.description }}>
        <Form.Item name="title" label="Title" required>
          <Input />
        </Form.Item>
        <Form.Item name="description" label="Description">
          <Input.TextArea />
        </Form.Item>
        <Form.Item >
          <Button type="primary" htmlType="submit" loading={mutation.status === 'pending'}>Save</Button>
        </Form.Item>
      </Form>
    </Drawer>
  )
}

export default EditServerSubTaskForm

import React from 'react'
import { Mentions, Form, Button } from 'antd'
import { useQuery } from '@tanstack/react-query'
import { getAllUsers } from '@/app/actions/users/userActions'
const { getMentions } = Mentions
const SubTaskCommentsForm = () => {
  // const queryClient = useQueryClient()
  const [form] = Form.useForm()

  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: () => getAllUsers()
  })

  

  const onFinish = async () => {
    const values = await form.validateFields()
    console.log('Form values:', values)
  }

  if (!users) return (<div>Error loading users</div>)

  return (
    <Form form={form} onFinish={onFinish}>
      <Form.Item name="comment" rules={[{ required: true }]}>
        <Mentions
          style={{ width: '100%' }}
          rows={4}
          options={users.map(user => ({ value: user.name ?? undefined, label: user.name ?? undefined })) ?? []}
          onChange={getMentions}
        />
      </Form.Item>
      <Form.Item>
        <Button type="primary" htmlType="submit">Submit</Button>
      </Form.Item>
    </Form>
  )
}

export default SubTaskCommentsForm
import React, { useState } from 'react'
import { Mentions, Form, Button, App } from 'antd'
import { useQuery } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
import { getAllUsers } from '@/app/actions/users/userActions'
import { createComment } from '@/app/actions/serverTasks/subTaskComments'

interface SubTaskCommentsFormProps {
  subTaskId: number
  onSubmitSuccess?: () => void
}

const SubTaskCommentsForm = ({ subTaskId, onSubmitSuccess }: SubTaskCommentsFormProps) => {
  const [form] = Form.useForm()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { data: session } = useSession()

  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: () => getAllUsers()
  })

  const { message } = App.useApp() // Uses the App context provided by AntdCompatibilityProvider

  const onFinish = async () => {
    if (!session?.user?.id) {
      message.error('You must be logged in to comment')
      return
    }

    try {
      setIsSubmitting(true)
      const values = await form.validateFields()
      const { comment } = values
      
      // Extract mentions from the comment
      const mentionMatches = comment.match(/@[\w\s]+/g) || []
      const mentions = mentionMatches.map((mention: string) => mention.slice(1).trim())
      
      await createComment({
        subTaskId,
        comment,
        mentions,
        userId: session.user.id
      })
      
      message.success('Comment added successfully')
      form.resetFields()
      
      if (onSubmitSuccess) {
        onSubmitSuccess()
      }
    } catch (error) {
      console.error('Failed to add comment:', error)
      message.error('Failed to add comment')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!users) return (<div>Error loading users</div>)

  return (
    <Form form={form} onFinish={onFinish}>
      <Form.Item name="comment" rules={[{ required: true, message: 'Please enter a comment' }]}>
        <Mentions
          style={{ width: '100%' }}
          rows={3}
          placeholder="Add a comment..."
          options={users.map(user => ({ 
            value: user.name ?? user.email ?? 'User', 
            label: user.name ?? user.email ?? 'User'
          }))}
        />
      </Form.Item>
      <Form.Item>
        <Button 
          type="primary" 
          htmlType="submit" 
          loading={isSubmitting}
        >
          Add Comment
        </Button>
      </Form.Item>
    </Form>
  )
}

export default SubTaskCommentsForm
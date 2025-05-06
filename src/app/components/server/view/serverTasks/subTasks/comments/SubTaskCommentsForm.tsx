import React, { useState } from 'react'
import { Form, Button, App, Input, Tabs, Typography } from 'antd'
import { EditOutlined, FormOutlined, EyeOutlined } from '@ant-design/icons'
import { useQuery } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
import { getAllUsers } from '@/app/actions/users/userActions'
import { createComment } from '@/app/actions/serverTasks/subTaskComments'
import ReactMarkdown from 'react-markdown'
import rehypeHighlight from 'rehype-highlight'
import rehypeRaw from 'rehype-raw'
import remarkGfm from 'remark-gfm'
import 'highlight.js/styles/github.css'
const { TextArea } = Input
const { Text } = Typography

interface SubTaskCommentsFormProps {
  subTaskId: number
  onSubmitSuccess?: () => void
}

const SubTaskCommentsForm = ({ subTaskId, onSubmitSuccess }: SubTaskCommentsFormProps) => {
  const [form] = Form.useForm()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [activeTab, setActiveTab] = useState('write')
  const [previewContent, setPreviewContent] = useState('')
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
      setPreviewContent('')
      setActiveTab('write')
      
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

  const handleTabChange = (key: string) => {
    if (key === 'preview') {
      const formValues = form.getFieldsValue()
      setPreviewContent(formValues.comment || '')
    }
    setActiveTab(key)
  }

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    form.setFieldsValue({ comment: e.target.value })
  }

  if (!users) return (<div>Error loading users</div>)

  return (
    <div className="comment-form">      
      <Form form={form} onFinish={onFinish}>
        <Tabs 
          activeKey={activeTab} 
          onChange={handleTabChange}
          items={[
            {
              key: 'write',
              label: <span><FormOutlined /> Write</span>,
              children: (
                <Form.Item name="comment" rules={[{ required: true, message: 'Please enter a comment' }]}>
                  <TextArea
                    rows={5}
                    placeholder="Add a comment... (Markdown and code blocks supported: ```js code here ```)"
                    onChange={handleContentChange}
                  />
                </Form.Item>
              ),
            },
            {
              key: 'preview',
              label: <span><EyeOutlined /> Preview</span>,
              children: (
                <div className="markdown-preview p-3 border rounded min-h-[120px] bg-white dark:bg-[#141414] dark:border-[#303030] markdown-content">
                  {previewContent ? (
                    <div className="dark:bg-transparent markdown-block">
                      <ReactMarkdown
                        rehypePlugins={[rehypeRaw, [rehypeHighlight, { detect: true }]]}
                        remarkPlugins={[remarkGfm]}
                      >
                        {previewContent}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <Text type="secondary" italic>Nothing to preview</Text>
                  )}
                </div>
              ),
            }
          ]}
        />
        
        <Form.Item className="mt-3">
          <Button 
            type="primary" 
            htmlType="submit" 
            loading={isSubmitting}
            icon={<EditOutlined />}
          >
            Add Comment
          </Button>
        </Form.Item>
      </Form>
    </div>
  )
}

export default SubTaskCommentsForm
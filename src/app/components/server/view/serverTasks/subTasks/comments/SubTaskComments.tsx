'use client'
import React, { useRef, useState } from 'react'
import { List, Avatar, Card, Spin, Typography, Button, Pagination, Select } from 'antd'
import { CommentOutlined } from '@ant-design/icons'
import { useSession } from 'next-auth/react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getComments } from '@/app/actions/serverTasks/subTaskComments'
import SubTaskCommentsForm from './SubTaskCommentsForm'
import DistanceToNow from '@/app/components/utils/DistanceToNow'
import ReactMarkdown from 'react-markdown'
import rehypeHighlight from 'rehype-highlight'
import rehypeRaw from 'rehype-raw'
import remarkGfm from 'remark-gfm'
import 'highlight.js/styles/github.css'

// Define a type for the comments returned by the server
type CommentWithUser = {
  id: number
  subTaskId: number
  userId: string
  comment: string
  mentions: string[]
  createdAt: Date
  updatedAt: Date
  user: {
    id: string
    name: string | null
    email: string | null
    image: string | null
  }
}

const { Text } = Typography

const SubTaskComments = ({ subTaskId }: { subTaskId: number }) => {
  const { data: session } = useSession()
  const queryClient = useQueryClient()
  const commentFormRef = useRef<HTMLDivElement>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const { data: comments = [], isLoading } = useQuery({
    queryKey: ['subTaskComments', subTaskId],
    queryFn: async () => {
      try {
        const data = await getComments(subTaskId)
        return data as CommentWithUser[] || []
      } catch (error) {
        console.error('Error fetching comments:', error)
        return []
      }
    },
    staleTime: 30000,
  })

  const scrollToCommentForm = () => {
    commentFormRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    // Scroll to top of comments section when changing pages
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handlePageSizeChange = (size: number) => {
    setPageSize(size)
    // Reset to first page when changing page size
    setCurrentPage(1)
  }

  // Calculate current comments to display based on pagination
  const startIndex = (currentPage - 1) * pageSize
  const endIndex = startIndex + pageSize
  const paginatedComments = comments.slice(startIndex, endIndex)

  if (isLoading) {
    return (
      <div className="flex justify-center p-4">
        <Spin />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <Typography.Title level={5} className="m-0">
          Comments ({comments.length})
        </Typography.Title>
        <Button 
          type="primary" 
          icon={<CommentOutlined />}
          onClick={scrollToCommentForm}
        >
          New Comment
        </Button>
      </div>

      {comments.length > 0 && (
        <div className="flex items-center mb-2 justify-end">
          <div className="flex items-center gap-2">
            <span>Show</span>
            <Select
              value={pageSize}
              onChange={handlePageSizeChange}
              options={[
                { value: 10, label: '10' },
                { value: 25, label: '25' },
                { value: 50, label: '50' },
                { value: 100, label: '100' },
              ]}
              style={{ width: 70 }}
            />
            <span>per page</span>
          </div>
        </div>
      )}

      <List
        dataSource={paginatedComments}
        locale={{ emptyText: 'No comments yet' }}
        renderItem={(comment: CommentWithUser) => {
          const isCurrentUserComment = comment.userId === session?.user?.id
          return (
            <List.Item>
              <Card 
                className={`w-full ${isCurrentUserComment ? 'bg-blue-50' : ''}`}
                size="small"
              >
                <div className="flex items-start gap-2">
                  <Avatar src={comment.user?.image} size="small">
                    {comment.user?.name?.charAt(0)?.toUpperCase()}
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <Text strong>{comment.user?.name || 'Unknown User'}</Text>
                      <Text type="secondary" className="text-xs">
                        <DistanceToNow date={comment.createdAt} />
                      </Text>
                    </div>
                    <div className="mt-1 markdown-content">
                      <ReactMarkdown
                        rehypePlugins={[rehypeRaw, [rehypeHighlight, { detect: true }]]}
                        remarkPlugins={[remarkGfm]}
                      >
                        {comment.comment}
                      </ReactMarkdown>
                    </div>
                  </div>
                </div>
              </Card>
            </List.Item>
          )
        }}
      />

      {comments.length > pageSize && (
        <div className="flex justify-center mt-4">
          <Pagination
            current={currentPage}
            pageSize={pageSize}
            total={comments.length}
            onChange={handlePageChange}
            showSizeChanger={false}
          />
        </div>
      )}

      <div ref={commentFormRef}>
        <SubTaskCommentsForm 
          subTaskId={subTaskId} 
          onSubmitSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['subTaskComments', subTaskId] })
            // Go to the first page to see the new comment
            setCurrentPage(1)
          }}
        />
      </div>
    </div>
  )
}

export default SubTaskComments
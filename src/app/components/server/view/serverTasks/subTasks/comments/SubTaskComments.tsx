'use client'
import React from 'react'
import { List, Avatar, Card, Spin, Typography } from 'antd'
import { useSession } from 'next-auth/react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getComments } from '@/app/actions/serverTasks/subTaskComments'
import SubTaskCommentsForm from './SubTaskCommentsForm'
import DistanceToNow from '@/app/components/utils/DistanceToNow'

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

  if (isLoading) {
    return (
      <div className="flex justify-center p-4">
        <Spin />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <List
        dataSource={comments}
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
                    {comment.user?.name?.charAt(0).toUpperCase()}
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <Text strong>{comment.user?.name || 'Unknown User'}</Text>
                      <Text type="secondary" className="text-xs">
                        <DistanceToNow date={comment.createdAt} />
                      </Text>
                    </div>
                    <div className="mt-1 whitespace-pre-wrap">
                      {comment.comment}
                    </div>
                  </div>
                </div>
              </Card>
            </List.Item>
          )
        }}
      />

      <SubTaskCommentsForm 
        subTaskId={subTaskId} 
        onSubmitSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['subTaskComments', subTaskId] })
        }}
      />
    </div>
  )
}

export default SubTaskComments
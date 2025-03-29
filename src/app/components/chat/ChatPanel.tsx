'use client'

import { useEffect, useRef, useState } from 'react'
import { Button, Input, Typography, Spin, Tabs, Badge, Avatar, Empty, Flex } from 'antd'
import { SendOutlined, UserOutlined } from '@ant-design/icons'
import { ChatProvider, useChat } from './ChatContext'
import { format } from 'date-fns'
import { ChatCategory, getChatCategoriesWithCounts } from '@/app/actions/chat/chatActions'
import { LucideIcon } from '@/types/icons'
import dynamic from 'next/dynamic'
import type { TabsProps } from 'antd'

// Dynamically import the icons to match those in the database
const Icons: Record<string, LucideIcon> = {
  'message-square': dynamic(() => import('lucide-react').then(mod => mod.MessageSquare)),
  'alert-triangle': dynamic(() => import('lucide-react').then(mod => mod.AlertTriangle)),
  'refresh-cw': dynamic(() => import('lucide-react').then(mod => mod.RefreshCw)),
  'help-circle': dynamic(() => import('lucide-react').then(mod => mod.HelpCircle)),
  'megaphone': dynamic(() => import('lucide-react').then(mod => mod.Megaphone)),
}

interface ChatPanelProps {
  serverId: number
}

// Wrapper component to provide context
export function ChatPanel({ serverId }: ChatPanelProps) {
  const [initialCategories, setInitialCategories] = useState<ChatCategory[]>([])
  const [loading, setLoading] = useState(true)
  const chatRoomId = `server:${serverId}`

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const categories = await getChatCategoriesWithCounts(chatRoomId)
        setInitialCategories(categories)
      } catch (error) {
        console.error('Error fetching categories:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchCategories()
  }, [chatRoomId])

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Spin size="large" />
      </div>
    )
  }

  if (initialCategories.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <Empty description="No chat categories available" />
      </div>
    )
  }

  return (
    <ChatProvider chatRoomId={chatRoomId} initialCategories={initialCategories}>
      <ChatPanelContent />
    </ChatProvider>
  )
}

// Content component that uses the chat context
function ChatPanelContent() {
  const {
    messages,
    categories,
    selectedCategoryId,
    loading,
    loadingMore,
    hasMore,
    selectCategory,
    loadMoreMessages,
    sendMessage
  } = useChat()
  
  const [messageText, setMessageText] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const [sending, setSending] = useState(false)

  // Scroll to bottom when new messages are added
  useEffect(() => {
    if (messagesEndRef.current && !loadingMore) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, loadingMore])

  // Handle infinite scroll when user scrolls up
  useEffect(() => {
    const container = messagesContainerRef.current
    if (!container) return

    const handleScroll = () => {
      if (
        container.scrollTop < 100 &&
        !loadingMore &&
        hasMore &&
        messages.length > 0
      ) {
        // Record the current scroll position and height
        const scrollHeight = container.scrollHeight
        
        loadMoreMessages().then(() => {
          // After loading more messages, restore the scroll position
          if (container) {
            const newScrollHeight = container.scrollHeight
            const heightDifference = newScrollHeight - scrollHeight
            container.scrollTop = heightDifference
          }
        })
      }
    }

    container.addEventListener('scroll', handleScroll)
    return () => container.removeEventListener('scroll', handleScroll)
  }, [loadMoreMessages, loadingMore, hasMore, messages.length])

  // Handle sending a message
  const handleSendMessage = async () => {
    if (!messageText.trim() || sending) return

    try {
      setSending(true)
      await sendMessage(messageText)
      setMessageText('')
    } finally {
      setSending(false)
    }
  }

  // Convert categories to tabs format
  const tabs: TabsProps['items'] = categories.map((category) => {
    const Icon = category.icon ? Icons[category.icon] : null
    
    return {
      key: category.id.toString(),
      label: (
        <Badge 
          count={category.id === selectedCategoryId ? 0 : category.messageCount}
          size="small"
          style={{ marginLeft: 8 }}
        >
          <span className="flex items-center gap-2">
            {Icon && <Icon className="w-4 h-4" />}
            {category.name}
          </span>
        </Badge>
      ),
      children: null // We're not using the built-in content feature
    }
  })

  return (
    <div className="flex flex-col h-full">
      {/* Category tabs */}
      <Tabs
        activeKey={selectedCategoryId?.toString()}
        onChange={(key) => selectCategory(parseInt(key, 10))}
        items={tabs}
      />

      {/* Messages container */}
      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto flex flex-col-reverse p-4 gap-4 min-h-0 max-h-[calc(100vh-200px)]"
      >
        {/* Loading indicator for more messages */}
        {loadingMore && (
          <div className="flex justify-center p-2">
            <Spin size="small" />
          </div>
        )}
        
        {/* Message list */}
        <div>
          {messages.length === 0 && !loading ? (
            <Empty description="No messages yet" />
          ) : (
            <>
              {loading ? (
                <div className="flex justify-center p-8">
                  <Spin size="large" />
                </div>
              ) : (
                messages.map((message) => (
                  <div key={message.id} className="mb-4">
                    <div className="flex items-start gap-2">
                      <Avatar 
                        src={message.userImage} 
                        icon={!message.userImage && <UserOutlined />}
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Typography.Text strong>{message.userName}</Typography.Text>
                          <Typography.Text type="secondary" className="text-xs">
                            {format(new Date(message.createdAt), 'MMM d, yyyy h:mm a')}
                          </Typography.Text>
                        </div>
                        <Typography.Paragraph className="mb-0">
                          {message.message}
                        </Typography.Paragraph>
                      </div>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>
      </div>

      {/* Message input */}
      <div className="p-4 border-t">
        <Flex gap="small">
          <Input
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onPressEnter={handleSendMessage}
            placeholder="Type your message..."
            disabled={!selectedCategoryId || sending}
          />
          <Button
            type="primary"
            icon={<SendOutlined />}
            onClick={handleSendMessage}
            loading={sending}
            disabled={!selectedCategoryId || !messageText.trim()}
          >
            Send
          </Button>
        </Flex>
      </div>
    </div>
  )
}

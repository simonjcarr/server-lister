'use client'

import { useEffect, useRef, useState } from 'react'
import { Button, Input, Typography, Spin, Tabs, Badge, Avatar, Empty, Flex } from 'antd'
import { SendOutlined, UserOutlined } from '@ant-design/icons'
import { ChatProvider, useChat } from './ChatContext'
import { ChatCategory, getChatCategoriesWithCounts } from '@/app/actions/chat/chatActions'
import { LucideIcon } from '@/types/icons'
import dynamic from 'next/dynamic'
import type { TabsProps } from 'antd'
import DistanceToNow from '../utils/DistanceToNow'

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
      <div className="h-full w-full flex items-center justify-center">
        <Spin size="large" />
      </div>
    )
  }

  if (initialCategories.length === 0) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <Empty description="No chat categories available" />
      </div>
    )
  }

  return (
    <div className="flex flex-col" style={{ height: '500px', overflow: 'hidden' }}>
      <ChatProvider chatRoomId={chatRoomId} initialCategories={initialCategories}>
        <ChatPanelContent />
      </ChatProvider>
    </div>
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
  const chatContainerRef = useRef<HTMLDivElement>(null)
  const [sending, setSending] = useState(false)

  // Scroll to bottom when new messages are added or component mounts
  useEffect(() => {
    if (messagesEndRef.current && !loadingMore) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, loadingMore])

  // Ensure scroll to bottom on initial load
  useEffect(() => {
    if (messagesEndRef.current && !loading && messages.length > 0) {
      messagesEndRef.current.scrollIntoView()
    }
  }, [loading, messages.length])

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
          overflowCount={99}
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
    <div className="flex flex-col h-full" style={{ overflow: 'hidden' }}>
      {/* Category tabs */}
      <div className="flex-shrink-0">
        <Tabs
          activeKey={selectedCategoryId?.toString()}
          onChange={(key) => selectCategory(parseInt(key, 10))}
          items={tabs}
        />
      </div>

      {/* Messages container */}
      <div 
        ref={messagesContainerRef}
        className="flex-grow overflow-y-auto p-4" 
        style={{ minHeight: 0 }} // This is crucial for flex items with overflow
      >
        {/* Loading indicator for more messages */}
        {loadingMore && (
          <div className="flex justify-center p-2">
            <Spin size="small" />
          </div>
        )}
        
        {/* Message list - showing latest messages at the bottom */}
        <div className="flex flex-col">
          {messages.length === 0 && !loading ? (
            <Empty description="No messages yet" />
          ) : (
            <>
              {loading ? (
                <div className="flex justify-center p-8">
                  <Spin size="large" />
                </div>
              ) : (
                // Display messages in chronological order with latest at the bottom
                // Adding padding at the end to ensure messages aren't cut off
                <div className="space-y-4 pb-2">
                  {[...messages].reverse().map((message) => (
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
                            <DistanceToNow date={new Date(message.createdAt)} />
                          </Typography.Text>
                        </div>
                        <Typography.Paragraph className="mb-0">
                          {message.message}
                        </Typography.Paragraph>
                      </div>
                    </div>
                  </div>
                  ))}
                </div>
              )}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>
      </div>

      {/* Message input */}
      <div className="p-4 border-t flex-shrink-0">
        <Flex gap="small" className="w-full">
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

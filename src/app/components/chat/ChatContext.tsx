'use client'

import { createContext, useContext, useState, useRef, useEffect, ReactNode } from 'react';
import { ChatMessage, ChatCategory } from '@/app/actions/chat/chatActions';

interface ChatContextType {
  messages: ChatMessage[];
  categories: ChatCategory[];
  selectedCategoryId: number | null;
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  selectCategory: (categoryId: number) => void;
  addMessage: (message: ChatMessage) => void;
  loadMoreMessages: () => Promise<void>;
  sendMessage: (message: string) => Promise<void>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

interface ChatProviderProps {
  children: ReactNode;
  chatRoomId: string;
  initialCategories: ChatCategory[];
}

export function ChatProvider({ children, chatRoomId, initialCategories }: ChatProviderProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [categories, setCategories] = useState<ChatCategory[]>(initialCategories);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(
    initialCategories.length > 0 ? initialCategories[0].id : null
  );
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [messageOffset, setMessageOffset] = useState(0);
  const eventSourceRef = useRef<EventSource | null>(null);
  const eventSourceInitialized = useRef(false);
  const lastEventIdRef = useRef<number | null>(null);
  // Track currently selected category for event handlers
  const selectedCategoryIdRef = useRef<number | null>(selectedCategoryId);

  // Function to select a category and load messages
  const selectCategory = async (categoryId: number) => {
    if (categoryId === selectedCategoryId) return;
    
    setSelectedCategoryId(categoryId);
    setMessages([]);
    setMessageOffset(0);
    setHasMore(true);
    
    // Reset the counter for the selected category
    setCategories((prevCategories) =>
      prevCategories.map((category) =>
        category.id === categoryId
          ? { ...category, messageCount: 0 } // Reset count when switching to this category
          : category
      )
    );
    
    try {
      setLoading(true);
      await fetchMessages(categoryId, 0);
    } finally {
      setLoading(false);
    }
  };

  // Function to fetch messages from the server
  const fetchMessages = async (categoryId: number, offset: number) => {
    try {
      const response = await fetch(
        `/api/chat/messages?chatRoomId=${encodeURIComponent(chatRoomId)}&categoryId=${categoryId}&limit=50&offset=${offset}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch messages');
      }
      
      const fetchedMessages: ChatMessage[] = await response.json();
      
      if (offset === 0) {
        // Fresh load of messages
        setMessages(fetchedMessages);
      } else {
        // Append to existing messages
        setMessages((prev) => [...prev, ...fetchedMessages]);
      }
      
      setHasMore(fetchedMessages.length === 50);
      setMessageOffset(offset + fetchedMessages.length);
      
      // Update the last event ID for SSE reconnection
      if (fetchedMessages.length > 0) {
        const highestId = Math.max(...fetchedMessages.map(m => m.id));
        if (lastEventIdRef.current === null || highestId > lastEventIdRef.current) {
          lastEventIdRef.current = highestId;
        }
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  // Function to load more messages (pagination)
  const loadMoreMessages = async () => {
    if (!selectedCategoryId || loadingMore || !hasMore) return;
    
    try {
      setLoadingMore(true);
      await fetchMessages(selectedCategoryId, messageOffset);
    } finally {
      setLoadingMore(false);
    }
  };

  // Helper function to just update category counts without adding to messages array
  const updateCategoryCount = (categoryId: number) => {
    setCategories((prevCategories) =>
      prevCategories.map((category) =>
        category.id === categoryId
          ? {
              ...category,
              messageCount: (category.messageCount || 0) + 1,
            }
          : category
      )
    );
  };

  // Function to add a new message to the state
  const addMessage = (message: ChatMessage) => {
    // Check if the message is already in the list to prevent duplicates
    const messageExists = messages.some((m) => m.id === message.id);
    
    if (messageExists) {
      console.log(`Message ${message.id} already exists, skipping`);
      return; // Skip if we already have this message
    }
    
    // This function should ONLY add messages that match the currently selected category
    if (message.categoryId === selectedCategoryId) {
      console.log(`Adding message ${message.id} to category ${selectedCategoryId}`);
      setMessages((prev) => [message, ...prev]);
      lastEventIdRef.current = Math.max(lastEventIdRef.current || 0, message.id);
    } else {
      console.warn(`Message ${message.id} doesn't match current category ${selectedCategoryId}, ignoring`);
    }
  };

  // Function to send a message
  const sendMessage = async (message: string) => {
    if (!selectedCategoryId || !message.trim()) return;
    
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          chatRoomId,
          categoryId: selectedCategoryId,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to send message');
      }
      
      // The message will be added by the SSE listener
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  // Set up the SSE connection
  useEffect(() => {
    if (!chatRoomId || eventSourceInitialized.current) return;
    
    const connectSSE = () => {
      const params = new URLSearchParams({
        chatRoomId,
      });
      
      if (lastEventIdRef.current) {
        params.append('lastEventId', lastEventIdRef.current.toString());
      }
      
      const url = `/api/chat?${params.toString()}`;
      const eventSource = new EventSource(url);
      
      eventSource.onopen = () => {
        console.log('SSE connection opened');
      };
      
      eventSource.addEventListener('message', (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('Message received from SSE:', data, 'Current category:', selectedCategoryIdRef.current);
          
          // IMPORTANT: Use the ref to get the current category ID
          const currentCategoryId = selectedCategoryIdRef.current;
          
          // Only add to messages list if it matches the current category
          if (data.categoryId === currentCategoryId) {
            addMessage(data);
          } else {
            // Otherwise, just update the counter
            updateCategoryCount(data.categoryId);
          }
        } catch (error) {
          console.error('Error parsing SSE message:', error);
        }
      });
      
      eventSource.addEventListener('ping', () => {
        // Keep the connection alive
      });
      
      eventSource.onerror = (error) => {
        console.error('SSE connection error:', error);
        eventSource.close();
        
        // Attempt to reconnect after a short delay
        setTimeout(connectSSE, 5000);
      };
      
      eventSourceRef.current = eventSource;
    };
    
    connectSSE();
    eventSourceInitialized.current = true;
    
    // Cleanup the SSE connection on unmount
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      eventSourceInitialized.current = false;
    };
  }, [chatRoomId]);

  // Update the ref when the selected category changes
  useEffect(() => {
    selectedCategoryIdRef.current = selectedCategoryId;
  }, [selectedCategoryId]);
  
  // Load initial messages when the selected category changes
  useEffect(() => {
    if (selectedCategoryId) {
      setLoading(true);
      fetchMessages(selectedCategoryId, 0)
        .finally(() => setLoading(false));
    }
  }, [selectedCategoryId]);

  const value = {
    messages,
    categories,
    selectedCategoryId,
    loading,
    loadingMore,
    hasMore,
    selectCategory,
    addMessage,
    loadMoreMessages,
    sendMessage,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}

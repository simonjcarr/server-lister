// This is a diagnostic page used for testing SSE connections
// It's currently disabled for production use
// To re-enable, remove the comments below

/*
'use client';

import { useEffect, useState } from 'react';
import { Button, Card, Alert, Typography, Divider } from 'antd';
import { useSession } from 'next-auth/react';

const { Title, Text, Paragraph } = Typography;

export default function TestSSEPage() {
  const { data: session } = useSession();
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [eventSource, setEventSource] = useState<EventSource | null>(null);

  // Handle sending a test notification
  const sendTestNotification = async () => {
    try {
      const response = await fetch('/api/testing/sse-test');
      const result = await response.json();
      
      if (result.success) {
        setMessages(prev => [...prev, 'Test notification sent. Check for incoming SSE event...']);
      } else {
        setError(`Failed to send test notification: ${result.message}`);
      }
    } catch (err) {
      setError(`Error sending test notification: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  // Connect to SSE endpoint
  const connectSSE = () => {
    if (eventSource) {
      eventSource.close();
    }

    try {
      const newEventSource = new EventSource('/api/sse/notifications');
      setEventSource(newEventSource);
      setMessages(prev => [...prev, 'Connecting to SSE...']);

      newEventSource.addEventListener('connected', (event) => {
        setConnected(true);
        setMessages(prev => [...prev, 'SSE connection established!']);
        setError(null);
      });

      newEventSource.addEventListener('notification', (event) => {
        setMessages(prev => [...prev, `Received notification: ${event.data}`]);
        console.log('Received notification event:', event.data);
      });

      newEventSource.onerror = (err) => {
        setError(`SSE connection error: ${JSON.stringify(err)}`);
        setConnected(false);
      };
    } catch (err) {
      setError(`Error creating SSE connection: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  // Disconnect from SSE
  const disconnectSSE = () => {
    if (eventSource) {
      eventSource.close();
      setEventSource(null);
      setConnected(false);
      setMessages(prev => [...prev, 'Disconnected from SSE']);
    }
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [eventSource]);

  if (!session?.user) {
    return (
      <Card>
        <Title level={3}>SSE Testing Page</Title>
        <Paragraph>You need to be signed in to use this test page.</Paragraph>
      </Card>
    );
  }

  return (
    <div className="p-4">
      <Card title="SSE Testing Page" className="max-w-3xl mx-auto">
        <Paragraph>
          This page helps test the Server-Sent Events (SSE) notification system. Use the buttons below to connect
          to the SSE endpoint and send test notifications.
        </Paragraph>
        
        <Divider />
        
        <div className="mb-4">
          <Text strong>User ID: </Text>
          <Text code>{session.user.id}</Text>
        </div>
        
        <div className="mb-4">
          <Text strong>Connection Status: </Text>
          <Text type={connected ? "success" : "danger"}>
            {connected ? "Connected" : "Disconnected"}
          </Text>
        </div>
        
        <div className="flex gap-4 mb-4">
          <Button 
            type="primary" 
            onClick={connectSSE} 
            disabled={connected}
          >
            Connect to SSE
          </Button>
          
          <Button 
            danger 
            onClick={disconnectSSE} 
            disabled={!connected}
          >
            Disconnect
          </Button>
          
          <Button 
            onClick={sendTestNotification} 
            disabled={!connected}
          >
            Send Test Notification
          </Button>
        </div>
        
        {error && (
          <Alert 
            message="Error" 
            description={error} 
            type="error" 
            showIcon 
            className="mb-4" 
          />
        )}
        
        <Divider>Event Log</Divider>
        
        <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md max-h-96 overflow-auto">
          {messages.length === 0 ? (
            <Text type="secondary">No events yet. Connect to SSE and send a test notification.</Text>
          ) : (
            messages.map((msg, i) => (
              <div key={i} className="mb-2 pb-2 border-b border-gray-200 dark:border-gray-700">
                <Text>{msg}</Text>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
*/

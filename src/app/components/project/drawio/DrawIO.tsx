// DrawIO.tsx - Self-hosted DrawIO component
import React, { useRef, useState, useEffect } from 'react';

// Self-hosted DrawIO URL - this should be the base URL of your DrawIO instance
const DRAWIO_URL = 'http://localhost:8080';

interface DrawIOEmbedProps {
  initialDiagramXml?: string;
  onSave?: (xml: string) => void;
  onLoad?: () => void;
}

function DrawIOEmbed({ initialDiagramXml, onSave, onLoad }: DrawIOEmbedProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  // Construct URL with proper parameters
  const getDrawioUrl = () => {
    return `${DRAWIO_URL}?embed=1&proto=json&spin=1`;
  };

  // Setup communication with the iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Verify message origin is from our DrawIO instance
      if (event.origin !== new URL(DRAWIO_URL).origin) return;

      try {
        // Parse message from DrawIO
        const message = JSON.parse(event.data);
        console.log('Received message from DrawIO:', message);
        
        // Critical: When we receive init message, hide the loading spinner
        if (message.event === 'init') {
          console.log('DrawIO initialized!');
          setIsLoading(false);
          if (onLoad) onLoad();
          
          // If diagram data is provided, load it
          if (initialDiagramXml && initialDiagramXml.length > 0) {
            console.log('Loading initial diagram data');
            sendMessageToDrawio({
              action: 'load',
              xml: initialDiagramXml
            });
          }
        }
        
        // Handle the save event
        if (message.event === 'save' && onSave && message.xml) {
          console.log('Saving diagram data');
          onSave(message.xml);
        }
      } catch (error) {
        console.error('Error handling message from DrawIO:', error);
      }
    };

    // Add event listener for messages
    window.addEventListener('message', handleMessage);
    
    // Clean up listener when component unmounts
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [initialDiagramXml, onSave, onLoad]);

  // Function to send messages to the DrawIO iframe
  const sendMessageToDrawio = (message: { action: string; xml?: string }) => {
    if (iframeRef.current?.contentWindow) {
      const targetOrigin = new URL(DRAWIO_URL).origin;
      iframeRef.current.contentWindow.postMessage(JSON.stringify(message), targetOrigin);
    }
  };

  return (
    <div style={{ width: '100%' }}>
      <div style={{ 
        width: '100%', 
        height: '70vh',
        position: 'relative',
        border: '1px solid #ccc'
      }}>
        <iframe
          ref={iframeRef}
          src={getDrawioUrl()}
          style={{ 
            width: '100%', 
            height: '100%', 
            border: 'none',
          }}
          onError={() => {
            console.error('Error loading DrawIO iframe');
            setLoadError('Failed to load DrawIO editor. Make sure it\'s running at ' + DRAWIO_URL);
            setIsLoading(false);
          }}
          title="DrawIO Editor"
        />
        
        {isLoading && (
          <div style={{ 
            position: 'absolute', 
            top: '50%', 
            left: '50%', 
            transform: 'translate(-50%, -50%)',
            backgroundColor: 'rgba(255,255,255,0.7)',
            padding: '10px 20px',
            borderRadius: '4px',
            textAlign: 'center',
            zIndex: 1000 // Ensure this is above the iframe
          }}>
            <div>Loading diagram editor...</div>
            <div style={{ fontSize: '0.8rem', marginTop: '8px' }}>Connecting to {DRAWIO_URL}</div>
          </div>
        )}
        
        {loadError && (
          <div style={{ 
            position: 'absolute', 
            top: '50%', 
            left: '50%', 
            transform: 'translate(-50%, -50%)',
            backgroundColor: 'rgba(255,255,255,0.9)',
            padding: '20px',
            borderRadius: '4px',
            border: '1px solid #f44336',
            maxWidth: '80%',
            textAlign: 'center',
            zIndex: 1000 // Ensure this is above the iframe
          }}>
            <div style={{ color: '#f44336', fontWeight: 'bold', marginBottom: '10px' }}>Error</div>
            <div>{loadError}</div>
            <div style={{ fontSize: '0.8rem', marginTop: '10px' }}>
              Check that DrawIO is running and accessible at <a href={DRAWIO_URL} target="_blank" rel="noopener noreferrer">{DRAWIO_URL}</a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default DrawIOEmbed;
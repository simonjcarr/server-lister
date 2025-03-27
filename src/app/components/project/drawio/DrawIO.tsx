// DrawIO.tsx - Self-hosted DrawIO component
import React, { useRef, useEffect } from 'react';

// Self-hosted DrawIO URL
const DRAWIO_URL = 'http://localhost:8080';

interface DrawIOEmbedProps {
  initialDiagramXml?: string;
  onSave?: (xml: string) => void;
  onLoad?: () => void;
}

function DrawIOEmbed({ initialDiagramXml, onSave, onLoad }: DrawIOEmbedProps) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  // Use the simplest way to view the basic editor 
  const getDrawioUrl = () => {
    return `${DRAWIO_URL}`;
  };

  // Setup communication with Draw.io
  useEffect(() => {
    const messageHandler = (event: MessageEvent) => {
      console.log('Message from Draw.io:', event.data);
      
      if (event.data === 'ready') {
        console.log('Draw.io is ready');
        if (onLoad) onLoad();
      }
      
      try {
        if (typeof event.data === 'string' && event.data.startsWith('{')) {
          const data = JSON.parse(event.data);
          
          if (data.event === 'save' && onSave) {
            onSave(data.xml);
          }
        }
      } catch (e) {
        console.error('Error parsing message:', e);
      }
    };
    
    window.addEventListener('message', messageHandler);
    
    return () => {
      window.removeEventListener('message', messageHandler);
    };
  }, [onLoad, onSave]);

  return (
    <div style={{ width: '100%', height: '70vh', border: '1px solid #ccc' }}>
      <iframe
        ref={iframeRef}
        src={getDrawioUrl()}
        style={{ width: '100%', height: '100%', border: 'none' }}
        title="DrawIO Editor"
        allowFullScreen
      />
    </div>
  );
}

export default DrawIOEmbed;
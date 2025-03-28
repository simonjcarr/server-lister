// DrawIO.tsx - Self-hosted DrawIO component
import React, { useRef, useEffect } from 'react';

// Self-hosted DrawIO URL with embed mode parameters
const DRAWIO_URL = `${process.env.DRAWIO_URL}?embed=1&proto=json` || 'http://localhost:8080?embed=1&proto=json';

interface DrawIOEmbedProps {
  initialDiagramXml?: string | null;
  onSave?: (xml: string) => void;
  onLoad?: () => void;
}

function DrawIOEmbed({ initialDiagramXml, onSave, onLoad }: DrawIOEmbedProps) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  // const [isFrameReady, setIsFrameReady] = useState(false);

  // Function to save diagram to database
  const saveDiagramToDatabase = (xml: string) => {
    // This function will be implemented by you to save the XML data to your database
    // Example implementation:
    /*
    const saveData = {
      id: diagramId,
      xml: xml,
      lastModified: new Date().toISOString()
    };
    
    // API call to your backend
    fetch('/api/diagrams/save', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(saveData)
    });
    */
    
    // Call the onSave callback if provided
    if (onSave) {
      onSave(xml);
    }
  };

  // Post a message to the iframe
  const postMessage = (message: unknown) => {
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage(JSON.stringify(message), '*');
    }
  };

  // Setup communication with Draw.io
  useEffect(() => {
    const messageHandler = (event: MessageEvent) => {
      if (typeof event.data === 'string') {
        try {
          // Handle messages from draw.io
          if (event.data === 'ready') {
            console.log('Draw.io is ready');
            // setIsFrameReady(true);
            if (onLoad) onLoad();
          } else if (event.data.startsWith('{')) {
            const msg = JSON.parse(event.data);
            console.log('Message from Draw.io:', msg);

            // Handle init event - draw.io is initialized and ready to receive commands
            if (msg.event === 'init') {
              // Load the diagram if we have initial XML
              if (initialDiagramXml) {
                postMessage({
                  action: 'load',
                  xml: initialDiagramXml,
                  autosave: 1,   // Enable autosave functionality
                  noSaveBtn: 0,  // Show the save button
                  noExitBtn: 1,  // Hide the exit button
                  saveAndExit: 0 // Don't show save and exit button
                });
              } else {
                // If no initial diagram, start with a template dialog
                postMessage({ action: 'template' });
              }
            }
            
            // Handle save event - user clicked save
            if (msg.event === 'save') {
              saveDiagramToDatabase(msg.xml);
              
              // Notify draw.io that save was successful and reset the modified state
              postMessage({
                action: 'status',
                message: 'Diagram saved successfully',
                modified: false
              });
            }
            
            // Handle autosave event
            if (msg.event === 'autosave') {
              console.log('Autosave triggered');
              saveDiagramToDatabase(msg.xml);
            }
            
            // Handle exit event
            if (msg.event === 'exit') {
              console.log('DrawIO editor closed');
            }
          }
        } catch (e) {
          console.error('Error parsing message:', e);
        }
      }
    };
    
    window.addEventListener('message', messageHandler);
    
    return () => {
      window.removeEventListener('message', messageHandler);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialDiagramXml, onLoad, onSave]);

  return (
    <div style={{ width: '100%', height: '70vh', border: '1px solid #ccc' }}>
      <iframe
        ref={iframeRef}
        src={DRAWIO_URL}
        style={{ width: '100%', height: '100%', border: 'none' }}
        title="DrawIO Editor"
        allowFullScreen
      />
    </div>
  );
}

export default DrawIOEmbed;
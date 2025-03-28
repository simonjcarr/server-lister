'use client'
// DrawIO.tsx - Self-hosted DrawIO component
import React, { useRef, useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query'
import { getDrawing, updateDrawingXML } from '@/app/actions/drawings/crudDrawings';
// Self-hosted DrawIO URL with embed mode parameters
const DRAWIO_URL = process.env.DRAWIO_URL ? 
  `${process.env.DRAWIO_URL}?embed=1&proto=json&noSaveBtn=0&saveAndExit=0&noExitBtn=1` : 
  'http://localhost:8080?embed=1&proto=json&noSaveBtn=0&saveAndExit=0&noExitBtn=1';

interface DrawIOEmbedProps {
  drawingId: number;
  onSave?: (xml: string) => void;
  onLoad?: () => void;
}

function DrawIOEmbed({ drawingId, onSave, onLoad }: DrawIOEmbedProps) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  // const [isFrameReady, setIsFrameReady] = useState(false);

  const xmlMutation = useMutation({
    mutationFn: async (xml: string) => {
      return await updateDrawingXML(drawingId, xml);
    }
  })

  const { data: xml } = useQuery({
    queryKey: ['drawing', drawingId],
    queryFn: async () => {
      const drawing = await getDrawing(drawingId);
      return drawing?.xml || null;
    }
  })

  // Function to save diagram to database
  const saveDiagramToDatabase = (xml: string) => {
    xmlMutation.mutate(xml);
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
    let isFirstInit = true;
    
    const messageHandler = (event: MessageEvent) => {
      if (typeof event.data === 'string') {
        try {
          // Handle messages from draw.io
          if (event.data === 'ready') {
            console.log('Draw.io is ready - sending init message');
            // This ensures we properly initialize communication with the editor
            postMessage({ action: 'init' });
            if (onLoad) onLoad();
          } else if (event.data.startsWith('{')) {
            const msg = JSON.parse(event.data);
            console.log('Message from Draw.io:', msg);

            if (msg.event === 'change') {
              console.log('Diagram changed', msg.xml);
            }
            // Handle init event - draw.io is initialized and ready to receive commands
            if (msg.event === 'init') {
              // Only process the init event once
              if (isFirstInit) {
                isFirstInit = false;
                // Load the diagram if we have initial XML
                if (xml) {
                  console.log('Loading existing XML into the editor');
                  postMessage({
                    action: 'load',
                    xml,
                    autosave: 0,   // Disable autosave functionality
                    modified: false,
                    noSaveBtn: 0,  // Show the save button
                    noExitBtn: 1,  // Hide the exit button
                    saveAndExit: 0 // Don't show save and exit button
                  });
                } else {
                  console.log('No existing XML, showing template dialog');
                  // If no initial diagram, show the template dialog
                  postMessage({ 
                    action: 'template'
                  });
                }
              }
            }
            
            if (msg.event === 'export') {
              if (msg.format === 'svg' && msg.data) {
                console.log('SVG export received');
                // Save the SVG data to your database
                // saveSvgToDatabase(msg.data);
              }
            }

            // Handle save event - user clicked save
            if (msg.event === 'save') {
              console.log('Save diagram');
              saveDiagramToDatabase(msg.xml);
              
              // Export the diagram as SVG (for preview purposes)
              postMessage({
                action: 'export',
                format: 'svg',
                xml: msg.xml,
                spin: 'Exporting'
              });
              
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
              // saveDiagramToDatabase(msg.xml);
            }
            
            // If msg.event is exit
            if (msg.event === 'exit') {
              console.log('User clicked exit button');
              // Handle the exit as needed
            }
            
            // Handle template event - user selected a template
            if (msg.event === 'template') {
              console.log('Template selected:', msg.name || 'unknown template');
              // When a template is selected, the XML is included in the message
              if (msg.xml) {
                console.log('Template XML received, saving...');
                saveDiagramToDatabase(msg.xml);
              }
            }
            
            // Handle configure event
            if (msg.event === 'configure') {
              console.log('Configure event:', msg);
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
  }, [xml, onLoad, onSave]);

  return (
    <div style={{ width: '100%', height: '70vh', border: '1px solid #ccc', position: 'relative' }}>
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
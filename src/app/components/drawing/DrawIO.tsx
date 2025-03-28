'use client'
// DrawIO.tsx - Self-hosted DrawIO component
import React, { useRef, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query'
import { updateDrawingXML } from '@/app/actions/drawings/crudDrawings';

// Self-hosted DrawIO URL with embed mode parameters
const DRAWIO_URL = process.env.DRAWIO_URL ? 
  `${process.env.DRAWIO_URL}?embed=1&proto=json&noSaveBtn=0&saveAndExit=0&noExitBtn=1` : 
  'http://localhost:8080?embed=1&proto=json&noSaveBtn=0&saveAndExit=0&noExitBtn=1';

interface DrawIOEmbedProps {
  drawingId: number;
  onSave?: (xml: string) => void;
  onLoad?: () => string;
  onExport?: (webpBase64: string) => void;
}

function DrawIOEmbed({ drawingId, onSave, onLoad, onExport }: DrawIOEmbedProps) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  
  

  const xmlMutation = useMutation({
    mutationFn: async (xml: string) => {
      return await updateDrawingXML(drawingId, xml);
    }
  });

  // Function to save diagram to database
  const saveDiagramToDatabase = (xml: string) => {
    xmlMutation.mutate(xml);
    
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
          // Handle ready message from the iframe
          if (event.data === 'ready') {
            postMessage({ action: 'init' });
          } else if (event.data.startsWith('{')) {
            const msg = JSON.parse(event.data);
            
            // Handle init event - draw.io is initialized and ready to receive commands
            if (msg.event === 'init') {
              
              // Get XML data to load
              let xmlToLoad = null;
              
              if (onLoad) {
                xmlToLoad = onLoad();
              }

              // Load diagram if we have XML
              if (xmlToLoad && xmlToLoad.length > 0) {
                postMessage({
                  action: 'load',
                  xml: xmlToLoad,
                  autosave: 0,
                  modified: false,
                  noSaveBtn: 0,
                  noExitBtn: 1,
                  saveAndExit: 0
                });
              } else {
                postMessage({ action: 'template' });
              }
            }

            // Handle save event - user clicked save
            if (msg.event === 'save') {
              saveDiagramToDatabase(msg.xml);
              
              // Export the diagram as image
              postMessage({
                action: 'export',
                format: 'png',
                xml: msg.xml,
                spin: 'Exporting',
                dpi: 300
              });
              
              // Notify draw.io that save was successful
              postMessage({
                action: 'status',
                message: 'Diagram saved successfully',
                modified: false
              });
            }
            
            // Handle export event
            if (msg.event === 'export') {
              if ((msg.format === 'png' || msg.format === 'webp') && msg.data && onExport) {
                onExport(msg.data);
              }
            }
            
            // Handle template event - user selected a template
            if (msg.event === 'template') {
              if (msg.xml) {
                saveDiagramToDatabase(msg.xml);
              }
            }
          }
        } catch {
        }
      }
    };
    
    window.addEventListener('message', messageHandler);
    
    return () => {
      window.removeEventListener('message', messageHandler);
    };
  }, [drawingId, onLoad, onSave, onExport]);

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
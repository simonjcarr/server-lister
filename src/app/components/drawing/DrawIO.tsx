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

  // Extract just the base64 data from a data URL
  const extractBase64FromDataUrl = (dataUrl: string): string => {
    const matches = dataUrl.match(/^data:image\/(png|jpeg|webp);base64,(.+)$/);
    return matches && matches.length >= 3 ? matches[2] : dataUrl;
  };

  // Setup communication with Draw.io
  useEffect(() => {
    console.log('Setting up Draw.io communication, drawingId:', drawingId);
    
    const messageHandler = (event: MessageEvent) => {
      if (typeof event.data === 'string') {
        try {
          // Handle ready message from the iframe
          if (event.data === 'ready') {
            console.log('Draw.io iframe is ready - sending init message');
            postMessage({ action: 'init' });
          } else if (event.data.startsWith('{')) {
            const msg = JSON.parse(event.data);
            
            // Handle init event - draw.io is initialized and ready to receive commands
            if (msg.event === 'init') {
              console.log('Draw.io editor initialized, ready to load XML');
              
              // Get XML data to load
              let xmlToLoad = null;
              
              if (onLoad) {
                console.log('Getting XML from onLoad callback');
                xmlToLoad = onLoad();
              }
              
              console.log('XML available:', !!xmlToLoad, 'length:', xmlToLoad?.length || 0);
              
              // Load diagram if we have XML
              if (xmlToLoad && xmlToLoad.length > 0) {
                console.log('Loading XML into the editor');
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
                console.log('No XML available, showing template dialog');
                postMessage({ action: 'template' });
              }
            }

            // Handle save event - user clicked save
            if (msg.event === 'save') {
              console.log('Save diagram');
              saveDiagramToDatabase(msg.xml);
              
              // Export the diagram as PNG (DrawIO doesn't directly support WebP export)
              postMessage({
                action: 'export',
                format: 'png',
                xml: msg.xml,
                spin: 'Exporting',
                dpi: 300, // Higher quality
                scale: 1, // 1:1 scale
                background: '#ffffff', // White background
                transparent: false // No transparent background
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
              if (msg.format === 'png' && msg.data && onExport) {
                console.log('PNG export received, data length:', typeof msg.data === 'string' ? msg.data.length : 'not a string');
                
                // Ensure it's a valid data URL or base64 string
                let dataToSave = '';
                
                if (typeof msg.data === 'string') {
                  if (msg.data.startsWith('data:')) {
                    // Extract just the base64 part from the data URL
                    dataToSave = extractBase64FromDataUrl(msg.data);
                  } else {
                    // Already a base64 string
                    dataToSave = msg.data;
                  }
                  
                  console.log('Processing image data for database, length:', dataToSave.length);
                  onExport(dataToSave);
                }
              }
            }
            
            // Handle template event - user selected a template
            if (msg.event === 'template') {
              console.log('Template selected');
              if (msg.xml) {
                console.log('Template XML received, saving...');
                saveDiagramToDatabase(msg.xml);
              }
            }
          }
        } catch (e) {
          console.error('Error processing message:', e);
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
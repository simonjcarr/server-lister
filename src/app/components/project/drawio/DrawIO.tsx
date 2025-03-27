// components/DrawIOEmbed.jsx
import React, { useEffect, useRef, useState } from 'react';

// IMPORTANT: Change this to your self-hosted URL
// Use HTTPS if you configured it via a reverse proxy
const SELF_HOSTED_DRAWIO_URL = 'http://<your-server-ip>:8080'; // Or 'https://<your-domain-or-ip>'

function DrawIOEmbed({ initialDiagramXml = '', onSave, onLoad }) {
  const iframeRef = useRef(null);
  const [isEditorReady, setIsEditorReady] = useState(false);

  const getEmbedUrl = () => {
    // Parameters remain largely the same
    const params = new URLSearchParams({
      embed: '1',
      ui: 'atlas',
      spin: '1',
      modified: 'unsavedChanges',
      proto: 'json',
      // Add/remove other params as needed for self-hosted version
    });
    // Use the SELF_HOSTED_DRAWIO_URL
    return `${SELF_HOSTED_DRAWIO_URL}?${params.toString()}`;
  };

  useEffect(() => {
    const handleMessage = (event) => {
      // IMPORTANT: Update the origin check to match your self-hosted URL's origin
      const expectedOrigin = new URL(SELF_HOSTED_DRAWIO_URL).origin;
      if (event.origin !== expectedOrigin || !event.data) {
        // console.log(`Ignoring message from origin: ${event.origin}. Expected: ${expectedOrigin}`);
        return;
      }

      try {
        const message = JSON.parse(event.data);
        // console.log('Message from self-hosted draw.io:', message);

        // --- The rest of the message handling logic remains the same ---
        switch (message.event) {
          case 'init':
            setIsEditorReady(true);
            if (onLoad) onLoad();
            if (initialDiagramXml) {
              postMessageToEditor({ action: 'load', xml: initialDiagramXml });
            }
            break;
          case 'save':
            if (onSave) onSave(message.xml);
            // Optionally trigger export if needed:
            // postMessageToEditor({ action: 'export', format: 'xmlsvg' });
            break;
          case 'autosave':
            if (onSave) onSave(message.xml);
            break;
          case 'export':
            console.log('Exported data:', message.data);
            // Handle exported data
            break;
          case 'exit':
            console.log('User requested exit');
            break;
          // ... other cases ...
        }
      } catch (e) {
        console.error('Error parsing message from self-hosted draw.io:', e, event.data);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onSave, onLoad, initialDiagramXml]); // Dependencies

  const postMessageToEditor = (message) => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      // IMPORTANT: Update the targetOrigin to match your self-hosted URL's origin
      const targetOrigin = new URL(SELF_HOSTED_DRAWIO_URL).origin;
      iframeRef.current.contentWindow.postMessage(
        JSON.stringify(message),
        targetOrigin
      );
    } else {
      console.warn('Self-hosted draw.io iframe not ready to receive messages.');
    }
  };

  // --- Trigger functions (triggerSave, triggerExport) remain the same ---

  // --- Render ---
  return (
    <div style={{ width: '100%', height: '70vh', border: '1px solid #ccc' }}>
      <iframe
        ref={iframeRef}
        src={getEmbedUrl()} // This now points to your local instance
        style={{ width: '100%', height: '100%', border: 'none' }}
        title="Diagram Editor (Self-Hosted)"
      // Optional: Add sandbox attribute for extra security if needed,
      // but ensure it allows necessary permissions for draw.io
      // sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
      />
    </div>
  );
}

export default DrawIOEmbed;
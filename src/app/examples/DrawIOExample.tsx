// DrawIOExample.tsx - Example usage of the DrawIO component
import React, { useState } from 'react';
import DrawIOEmbed from '../components/drawing/DrawIO';

const DrawIOExample: React.FC = () => {
  const [diagramXml, setDiagramXml] = useState<string | undefined>(undefined);
  const [isLoaded, setIsLoaded] = useState(false);

  // This function will be called when the diagram is saved
  const handleSave = (xml: string) => {
    console.log('Diagram saved!');
    setDiagramXml(xml);

    // In a real application, you would save this XML to your database
    // Example:
    // saveDiagramToDatabase(xml);
  };

  // This function will be called when DrawIO is loaded
  const handleLoad = () => {
    console.log('DrawIO loaded!');
    setIsLoaded(true);
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">DrawIO Integration Example</h1>

      <div className="mb-4">
        <p>Status: {isLoaded ? 'DrawIO Loaded' : 'Loading DrawIO...'}</p>
      </div>

      <DrawIOEmbed
        initialDiagramXml={diagramXml}
        onSave={handleSave}
        onLoad={handleLoad}
        diagramId="example-diagram-001"
      />

      {diagramXml && (
        <div className="mt-4">
          <h2 className="text-xl font-semibold mb-2">Saved Diagram Data:</h2>
          <div className="bg-gray-100 p-2 rounded">
            <code className="text-xs whitespace-pre-wrap">
              {diagramXml.substring(0, 200)}...
            </code>
          </div>
        </div>
      )}
    </div>
  );
};

export default DrawIOExample;

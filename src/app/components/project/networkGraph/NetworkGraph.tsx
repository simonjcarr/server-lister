'use client'; // This component uses browser APIs and state, so it must be a Client Component

import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { DataSet } from 'vis-data/peer'; // Use peer build for better tree shaking
import { Network } from 'vis-network/peer';
import type { Node, Edge, Options, IdType, Color, Font } from 'vis-network/peer'; // Added Color, Font types
import { v4 as uuidv4 } from 'uuid';
import 'vis-network/styles/vis-network.css'; // Import vis-network CSS

// --- Type Definitions ---

export type NodeType = 'server' | 'client' | 'router' | 'firewall' | 'switch' | 'cloud' | 'other';

// Extend vis-network's Node interface
export interface NetworkNode extends Node {
  id: IdType; // Ensure id is always present and correctly typed
  label: string;
  nodeType: NodeType;
  // Add other custom properties if needed
  x?: number; // Explicitly add x/y for clarity, though Node includes them
  y?: number;
  // Override font to be more specific if we only use objects or undefined
  // font?: Font | undefined; // Or keep string | Font | undefined if needed elsewhere
}

// Extend vis-network's Edge interface
export interface NetworkEdge extends Edge {
  id: IdType; // Ensure id is always present and correctly typed
  from: IdType;
  to: IdType;
  // Add other custom properties if needed
}

// Structure for storing/loading the graph state
export interface GraphData {
  nodes: NetworkNode[];
  edges: NetworkEdge[];
}

// --- Stub Functions ---

// Placeholder function to simulate loading data from a backend
async function loadData(): Promise<GraphData | null> {
  console.log('Attempting to load data...');
  // In a real app, fetch this from your API endpoint
  // Example: const response = await fetch('/api/network-graph');
  //         if (!response.ok) return null;
  //         return await response.json();

  // Return some default data for demonstration if no data is "loaded"
  const defaultData: GraphData = {
    nodes: [
      { id: 'server1', label: 'Main Server', nodeType: 'server', x: 0, y: 0 },
      { id: 'router1', label: 'Core Router', nodeType: 'router', x: 0, y: 150 },
      { id: 'fw1', label: 'Firewall', nodeType: 'firewall', x: 0, y: 300 },
      { id: 'client1', label: 'Client A', nodeType: 'client', x: -150, y: 450 },
      { id: 'client2', label: 'Client B', nodeType: 'client', x: 150, y: 450 },
    ],
    edges: [
      { id: uuidv4(), from: 'server1', to: 'router1' },
      { id: uuidv4(), from: 'router1', to: 'fw1' },
      { id: uuidv4(), from: 'fw1', to: 'client1' },
      { id: uuidv4(), from: 'fw1', to: 'client2' },
    ],
  };
  // DO NOT delay in development to avoid loading state issues
  // await new Promise(resolve => setTimeout(resolve, 500));
  console.log('Loaded default data:', defaultData);
  return defaultData; // Return default data to ensure graph initializes properly
}

// Placeholder function to simulate saving data to a backend
async function saveData(graphData: GraphData): Promise<boolean> {
  console.log('Attempting to save data:', JSON.stringify(graphData, null, 2)); // Pretty print JSON
  // In a real app, send this to your API endpoint
  // Example: const response = await fetch('/api/network-graph', {
  //            method: 'POST',
  //            headers: { 'Content-Type': 'application/json' },
  //            body: JSON.stringify(graphData),
  //          });
  //          return response.ok;

  // Simulate saving delay
  await new Promise(resolve => setTimeout(resolve, 500));
  console.log('Data saved successfully (simulated).');
  return true; // Indicate success
}


// --- Helper Function for Node Styles ---
// Returns Partial<NetworkNode> but NetworkNode includes all Node properties
const getNodeStyle = (nodeType: NodeType): Partial<NetworkNode> => {
  switch (nodeType) {
    case 'server':
      // Using object for color to potentially define border/highlight later
      return { shape: 'box', color: { background: '#4CAF50', border: '#2E7D32' } as Color, font: { color: '#ffffff' } as Font };
    case 'client':
      // Using string for color
      return { shape: 'dot', color: '#2196F3' as Color, size: 15 }; // No font defined here
    case 'router':
      return { shape: 'diamond', color: { background: '#FF9800', border: '#EF6C00' } as Color, size: 20 }; // No font defined here
    case 'firewall':
      return { shape: 'triangle', color: { background: '#F44336', border: '#C62828' } as Color, size: 20 }; // No font defined here
    case 'switch':
      // Mixed usage for demo
      return { shape: 'box', color: '#9C27B0' as Color, size: 18, font: { color: '#ffffff' } as Font };
    case 'cloud':
      return { shape: 'ellipse', color: { background: '#607D8B', border: '#455A64' } as Color, label: 'Cloud' }; // No font defined here
    case 'other':
    default:
      return { shape: 'ellipse', color: { background: '#9E9E9E', border: '#616161' } as Color }; // No font defined here
  }
};

// --- Network Graph Component ---

const NetworkGraph: React.FC = () => {
  const visJsRef = useRef<HTMLDivElement>(null);
  const networkInstanceRef = useRef<Network | null>(null);
  const nodesDataSetRef = useRef<DataSet<NetworkNode>>(new DataSet<NetworkNode>([]));
  const edgesDataSetRef = useRef<DataSet<NetworkEdge>>(new DataSet<NetworkEdge>([]));

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [interactionMode, setInteractionMode] = useState<'idle' | 'addingEdge'>('idle');
  const [key, setKey] = useState(0); // New state to force remount

  // Define Node Types for the draggable palette
  const nodeTypes = useMemo<NodeType[]>(() => 
    ['server', 'client', 'router', 'firewall', 'switch', 'cloud', 'other'], 
  []);

  // --- Initialization ---
  useEffect(() => {
    console.log('NetworkGraph component mounted with key:', key);
    // Always reset loading state on mount
    setIsLoading(true);
    
    // Avoid duplicate initialization if refs are already populated
    if (networkInstanceRef.current) {
      console.log('Skipping initialization - network already initialized');
      setIsLoading(false); // Make sure to update loading state
      return;
    }

    if (!visJsRef.current) {
      console.log('Skipping initialization - container ref missing');
      // Don't set loading to false yet - wait for the ref to be available
      return;
    }

    let isMounted = true; // Flag to prevent state updates on unmounted component
    let network: Network | null = null; // Hold network instance locally in effect scope
    
    // Capture the ref value to use in cleanup function
    const visJsContainer = visJsRef.current;

    const initializeGraph = async () => {
      try {
        console.log('Initializing graph...');
        const initialData = await loadData();

        // Ensure we are still mounted and container exists before proceeding
        if (!isMounted) {
          console.log('Initialization aborted: Component unmounted');
          return;
        }
        
        if (!visJsRef.current) {
          console.log('Initialization aborted: Container missing');
          if (isMounted) setIsLoading(false); // Update loading state
          return;
        }

        if (initialData) {
          console.log('Initial data loaded, applying styles...');
          // Apply styles based on nodeType when loading
          const styledNodes = initialData.nodes.map(node => ({
            ...node,
            ...getNodeStyle(node.nodeType),
          }));
          nodesDataSetRef.current.clear();
          edgesDataSetRef.current.clear();
          nodesDataSetRef.current.add(styledNodes);
          edgesDataSetRef.current.add(initialData.edges);
        } else {
          // Handle case where no data is loaded (e.g., show empty graph)
          nodesDataSetRef.current.clear();
          edgesDataSetRef.current.clear();
          console.log("No initial data loaded, starting with an empty graph.");
        }

        // --- Create Network Instance ---
        // Check again if container exists and instance isn't already created in this effect run
        if (visJsRef.current && !network) {
          console.log('Creating network instance...');
          const options: Options = {
            physics: {
              enabled: true,
              stabilization: { iterations: 1000, fit: true },
              solver: 'barnesHut',
              barnesHut: { gravitationalConstant: -8000, springConstant: 0.04, springLength: 120 }
            },
            interaction: {
              dragNodes: true, 
              dragView: true, 
              zoomView: true, 
              multiselect: true, 
              tooltipDelay: 200,
              hover: true
            },
            manipulation: {
              enabled: false, 
              addEdge: (edgeData, callback) => {
                console.log('Edge creation event:', edgeData);
                const newEdge: NetworkEdge = { 
                  ...edgeData, 
                  id: uuidv4(),
                  arrows: 'to',
                  color: { color: '#848484', highlight: '#575757', hover: '#575757' },
                  width: 1,
                  smooth: { enabled: true, type: "continuous", roundness: 0.5 }
                };

                if (newEdge.from === newEdge.to) {
                  console.warn("Cannot connect node to itself.");
                  callback(null); 
                } else {
                  console.log('Adding edge:', newEdge);
                  edgesDataSetRef.current.add(newEdge);
                  callback(newEdge); 
                  
                  if (networkInstanceRef.current) {
                    networkInstanceRef.current.disableEditMode();
                    setInteractionMode('idle');
                  }
                }
              },
              editEdge: (edgeData: { from: IdType; to: IdType; id?: IdType }, callback) => {
                const updatedEdge = { ...edgeData, id: edgeData.id };
                console.log('Editing edge:', updatedEdge);
                edgesDataSetRef.current.update(updatedEdge);
                callback(updatedEdge);
              },
            },
          };

          try {
            console.log('Creating network with container:', visJsRef.current);
            network = new Network(
              visJsRef.current,
              { 
                nodes: nodesDataSetRef.current, 
                edges: edgesDataSetRef.current 
              },
              options
            );
            
            // Store in ref for other methods to access
            networkInstanceRef.current = network;
            
            // Add event listeners here
            network.on('click', (params) => {
              console.log('Click event:', params);
              // Handle node/edge selection, etc.
            });

            // Handle potential DOM errors by setting up error handler
            network.on('beforeDrawing', () => {
              if (!visJsRef.current || !document.body.contains(visJsRef.current)) {
                console.error('DOM inconsistency detected: vis container not in document');
                if (isMounted) {
                  setKey(prev => prev + 1);
                }
              }
            });
            
            console.log('Network instance created successfully.');
          } catch (error) {
            console.error('Error creating network:', error);
            if (isMounted) {
              setKey(prev => prev + 1);
            }
          }
        }

        // Final step: update loading state
        if (isMounted) {
          console.log('Initialization complete, setting loading to false');
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Unexpected error during graph initialization:', error);
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    // Start the initialization process
    initializeGraph();

    // Cleanup function - VERY IMPORTANT for preventing memory leaks and DOM issues
    return () => {
      console.log('Cleaning up network resources...');
      isMounted = false;
      
      const networkInstance = networkInstanceRef.current;
      networkInstanceRef.current = null;
      
      if (networkInstance) {
        try {
          networkInstance.destroy();
          console.log('Network instance destroyed.');
        } catch (error) {
          console.error('Error destroying network instance:', error);
          setKey(prev => prev + 1);
        }
      }

      if (visJsContainer) {
        try {
          visJsContainer.innerHTML = '';
          console.log('Vis container HTML cleared');
        } catch (e) {
          console.error('Error clearing vis container:', e);
        }
      }
    };
  }, [key]); 

  // --- Interaction Handlers ---

  const handleDragStart = (event: React.DragEvent, nodeType: NodeType) => {
    event.dataTransfer.setData('application/reactflow', nodeType); 
    event.dataTransfer.effectAllowed = 'copy'; 
  };

  const handleAddNode = useCallback((nodeType: NodeType, clientX: number, clientY: number) => {
    console.log('handleAddNode called with:', nodeType, clientX, clientY);
    
    if (!networkInstanceRef.current) {
      console.error('Cannot add node: Network instance not initialized');
      const newNode: NetworkNode = {
        id: uuidv4(),
        label: `New ${nodeType}`,
        nodeType,
        x: 0, 
        y: 0,
        ...getNodeStyle(nodeType)
      };
      nodesDataSetRef.current?.add(newNode);
      console.log('Added node at default position:', newNode);
      return;
    }
    
    const canvasPosition = networkInstanceRef.current.DOMtoCanvas({ x: clientX, y: clientY });
    console.log('Converted to canvas position:', canvasPosition);
    
    const newNode: NetworkNode = {
      id: uuidv4(), 
      label: `New ${nodeType}`,
      nodeType,
      x: canvasPosition.x,
      y: canvasPosition.y,
      ...getNodeStyle(nodeType) 
    };
    
    console.log('Adding node:', newNode);
    nodesDataSetRef.current?.add(newNode);
  }, []);

  const handleStartAddEdge = useCallback(() => {
    if (!networkInstanceRef.current) {
      console.error('Cannot start edge creation: Network not initialized');
      return;
    }

    if (interactionMode === 'addingEdge') {
      networkInstanceRef.current.disableEditMode();
      setInteractionMode('idle');
      console.log('Edge creation mode canceled');
    } else {
      networkInstanceRef.current.addEdgeMode();
      setInteractionMode('addingEdge');
      console.log('Edge creation mode started - click on a source node, then click on a target node');
    }
  }, [interactionMode]);

  const handleSaveGraph = useCallback(async () => {
    setIsSaving(true);
    
    try {
      const nodes = nodesDataSetRef.current.get() as NetworkNode[];
      const edges = edgesDataSetRef.current.get() as NetworkEdge[];
      
      const graphData: GraphData = { nodes, edges };
      const success = await saveData(graphData);
      
      if (success) {
        console.log('Graph saved successfully!');
      } else {
        console.error('Failed to save graph data.');
      }
    } catch (error) {
      console.error('Error while saving graph:', error);
    } finally {
      setIsSaving(false);
    }
  }, []);

  // --- Render ---
  return (
    <div className="network-graph-container" style={{ width: '100%', height: '600px', display: 'flex', flexDirection: 'column' }}>
      {/* Debug info - uncomment for troubleshooting */}
      <div style={{ background: '#f8f9fa', padding: '4px 8px', fontSize: '12px', color: '#666', borderBottom: '1px solid #ddd' }}>
        Status: {isLoading ? 'Loading' : 'Ready'} | 
        Key: {key} | 
        Network Instance: {networkInstanceRef.current ? 'Initialized' : 'Not Initialized'}
      </div>
      {/* Controls */}
      <div className="controls" style={{ display: 'flex', padding: '10px', backgroundColor: '#f5f5f5', borderBottom: '1px solid #ddd' }}>
        {/* Node Palette */}
        {nodeTypes.map((type) => {
          const style = getNodeStyle(type);
          let bgColor = '#e0e0e0';
          if (typeof style.color === 'string') {
            bgColor = style.color;
          } else if (style.color && typeof style.color === 'object' && 'background' in style.color) {
            bgColor = style.color.background as string;
          }
          
          return (
            <div
              key={type}
              draggable
              onDragStart={(e) => handleDragStart(e, type)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: '60px', height: '30px', margin: '0 5px', padding: '5px',
                backgroundColor: bgColor, border: '1px solid #aaa',
                borderRadius: '4px', cursor: 'grab'
              }}
              title={`Drag to add a new ${type}`}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </div>
          );
        })}

        {/* Connection and Save Controls */}
        <div style={{
          marginLeft: 'auto',
          display: 'flex',
          gap: '10px',
          alignItems: 'center'
        }}>
          {/* Add Edge Button - Made more prominent */}
          <button 
            onClick={handleStartAddEdge} 
            style={{
              padding: '6px 12px',
              fontWeight: 'bold',
              backgroundColor: interactionMode === 'addingEdge' ? '#ffc107' : '#4CAF50',
              color: 'white',
              border: interactionMode === 'addingEdge' ? '2px solid #e0a800' : '2px solid #388E3C',
              borderRadius: '4px', 
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px'
            }}
            title={interactionMode === 'addingEdge' ? "Cancel adding edge" : "Add a connection between nodes"}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14"></path>
              <path d="M12 5v14"></path>
            </svg>
            {interactionMode === 'addingEdge' ? 'Cancel' : 'Add Connection'}
          </button>

          {/* Save Button */}
          <button 
            onClick={handleSaveGraph} 
            disabled={isSaving || isLoading} 
            style={{
              padding: '6px 12px',
              backgroundColor: '#2196F3', 
              color: 'white', 
              border: '2px solid #0b7dda',
              borderRadius: '4px', 
              cursor: 'pointer', 
              opacity: (isSaving || isLoading) ? 0.6 : 1
            }}
          >
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        </div>

        {/* Edge creation mode indicator */}
        {interactionMode === 'addingEdge' && (
          <div style={{ 
            position: 'absolute',
            top: '52px',
            right: '10px',
            padding: '5px 10px',
            backgroundColor: '#fff3cd', 
            border: '1px solid #ffeeba',
            borderRadius: '4px',
            color: '#856404',
            zIndex: 10
          }}>
            Click on a source node, then click on a target node
          </div>
        )}
      </div>
      
      {/* Graph Visualization Container */}
      <div 
        id="network-container"
        style={{
          flex: 1, 
          position: 'relative',
          border: '1px solid #ddd',
          backgroundColor: '#f9f9f9',
          cursor: interactionMode === 'addingEdge' ? 'crosshair' : 'default'
        }}
        onDragOver={(e) => {
          e.preventDefault();
          e.dataTransfer.dropEffect = 'copy';
          console.log('Drag over network container');
        }}
        onDrop={(e) => {
          e.preventDefault();
          const nodeType = e.dataTransfer.getData('application/reactflow') as NodeType;
          console.log('Drop detected with node type:', nodeType);
          
          if (nodeTypes.includes(nodeType)) {
            handleAddNode(nodeType, e.clientX, e.clientY);
          } else {
            console.warn('Invalid node type from drop event:', nodeType);
          }
        }}
      >
        {/* Always render the vis container - this prevents SSR issues */}
        <div 
          ref={visJsRef} 
          style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }} 
          key={key} 
        />
        
        {/* Status overlay */}
        {isLoading && (
          <div style={{ 
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
            display: 'flex', justifyContent: 'center', alignItems: 'center',
            backgroundColor: 'rgba(255, 255, 255, 0.7)', zIndex: 5
          }}>
            Loading graph data...
          </div>
        )}
        {interactionMode === 'addingEdge' && !isLoading && (
          <div style={{ 
            position: 'absolute', top: '10px', left: '10px', right: '10px',
            padding: '8px', borderRadius: '4px',
            backgroundColor: 'rgba(255, 193, 7, 0.2)', 
            border: '1px solid #ffc107',
            zIndex: 5, textAlign: 'center',
            pointerEvents: 'none' 
          }}>
            <strong>Edge Creation Mode</strong>: Click on a source node, then click on a target node to connect them
          </div>
        )}
      </div>
    </div>
  );
};

export default NetworkGraph;
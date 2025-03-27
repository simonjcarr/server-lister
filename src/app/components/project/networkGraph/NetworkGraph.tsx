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
              dragNodes: true, dragView: true, zoomView: true, tooltipDelay: 200, hover: true
            },
            manipulation: {
              enabled: false,
              addEdge: (edgeData, callback) => {
                const newEdge: NetworkEdge = { ...edgeData, id: uuidv4() };
                if (newEdge.from === newEdge.to) {
                  console.warn("Cannot connect node to itself.");
                  callback(null);
                } else {
                  console.log('Adding edge:', newEdge);
                  edgesDataSetRef.current.add(newEdge);
                  callback(newEdge);
                  setInteractionMode('idle');
                  networkInstanceRef.current?.disableEditMode();
                }
              },
              editNode: (nodeData, callback) => {
                console.log('Editing node (raw):', nodeData);
                const cleanNodeData: Partial<NetworkNode> = {
                  id: nodeData.id, label: nodeData.label,
                  // Don't automatically apply style here as it may override dragged node's style
                };
                callback(cleanNodeData as NetworkNode);
              }
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
              // This event fires frequently during rendering
              // We can use it to detect if the network is still functioning properly
              if (!visJsRef.current || !document.body.contains(visJsRef.current)) {
                console.error('DOM inconsistency detected: vis container not in document');
                // Force a complete remount of the component
                if (isMounted) {
                  setKey(prev => prev + 1);
                }
              }
            });
            
            console.log('Network instance created successfully.');
          } catch (error) {
            console.error('Error creating network:', error);
            // If we hit an error during creation, increment the key to force a remount on next render
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
        // Make sure we still update the loading state even if there's an error
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
      
      // First set the ref to null to prevent other code from using it
      const networkInstance = networkInstanceRef.current;
      networkInstanceRef.current = null;
      
      // Then properly destroy the network instance
      if (networkInstance) {
        try {
          networkInstance.destroy();
          console.log('Network instance destroyed.');
        } catch (error) {
          console.error('Error destroying network instance:', error);
          // If we hit an error during cleanup, increment the key to force a complete
          // remount on next render cycle
          setKey(prev => prev + 1);
        }
      }

      // Explicitly clear the container's HTML to prevent React/DOM conflicts
      // Use the captured ref value from when the effect ran
      if (visJsContainer) {
        try {
          visJsContainer.innerHTML = '';
          console.log('Vis container HTML cleared');
        } catch (e) {
          console.error('Error clearing vis container:', e);
        }
      }
    };
  }, [key]); // Use key as a dependency to force remount

  // --- Interaction Handlers ---

  const handleDragStart = (event: React.DragEvent, nodeType: NodeType) => {
    event.dataTransfer.setData('application/reactflow', nodeType); // Use a specific data type
    event.dataTransfer.effectAllowed = 'copy'; // Show copy cursor
  };

  // Helper function to add a node at specific coordinates
  const handleAddNode = useCallback((nodeType: NodeType, clientX: number, clientY: number) => {
    console.log('handleAddNode called with:', nodeType, clientX, clientY);
    
    if (!networkInstanceRef.current) {
      console.error('Cannot add node: Network instance not initialized');
      // Create a fallback node if network isn't ready
      const newNode: NetworkNode = {
        id: uuidv4(),
        label: `New ${nodeType}`,
        nodeType,
        x: 0, // Use center if we can't convert coordinates
        y: 0,
        ...getNodeStyle(nodeType)
      };
      nodesDataSetRef.current?.add(newNode);
      console.log('Added node at default position:', newNode);
      return;
    }
    
    // Get canvas coordinates from screen coordinates
    const canvasPosition = networkInstanceRef.current.DOMtoCanvas({ x: clientX, y: clientY });
    console.log('Converted to canvas position:', canvasPosition);
    
    const newNode: NetworkNode = {
      id: uuidv4(), // Generate a unique ID
      label: `New ${nodeType}`,
      nodeType,
      x: canvasPosition.x,
      y: canvasPosition.y,
      ...getNodeStyle(nodeType) // Apply style based on type
    };
    
    console.log('Adding node:', newNode);
    nodesDataSetRef.current?.add(newNode);
  }, []);

  // Cancel edge creation
  const handleCancelAddEdge = useCallback(() => {
    if (networkInstanceRef.current) {
      networkInstanceRef.current.disableEditMode();
      setInteractionMode('idle');
    }
  }, []);

  // Start adding an edge or cancel if already in edge mode
  const handleStartAddEdge = useCallback(() => {
    if (networkInstanceRef.current) {
      if (interactionMode === 'addingEdge') {
        // Cancel edge creation if already in progress
        handleCancelAddEdge();
      } else {
        // Start edge creation
        networkInstanceRef.current.addEdgeMode();
        setInteractionMode('addingEdge');
      }
    }
  }, [interactionMode, handleCancelAddEdge]);

  const handleSaveGraph = useCallback(async () => {
    setIsSaving(true);
    
    try {
      const nodes = nodesDataSetRef.current.get() as NetworkNode[];
      const edges = edgesDataSetRef.current.get() as NetworkEdge[];
      
      const graphData: GraphData = { nodes, edges };
      const success = await saveData(graphData);
      
      if (success) {
        console.log('Graph saved successfully!');
        // Maybe show a success toast/notification here
      } else {
        console.error('Failed to save graph data.');
        // Maybe show an error toast/notification here
      }
    } catch (error) {
      console.error('Error while saving graph:', error);
      // Maybe show an error toast/notification here
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
          // Get the style for this node type
          const style = getNodeStyle(type);
          // Extract background color safely
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
        {/* Buttons */}
        <button onClick={handleStartAddEdge} style={{
          marginLeft: 'auto', padding: '5px 10px',
          backgroundColor: interactionMode === 'addingEdge' ? '#ffc107' : '#e0e0e0',
          border: '1px solid #aaa', borderRadius: '4px', cursor: 'pointer'
        }}
          title={interactionMode === 'addingEdge' ? "Cancel adding edge" : "Add an edge between two nodes"} >
          {interactionMode === 'addingEdge' ? 'Cancel' : 'Add Edge'}
        </button>
        {interactionMode === 'addingEdge' && (
          <div style={{ marginLeft: '5px', color: '#ffc107', fontStyle: 'italic' }}>
            Click on a node, then click on another node to connect them
          </div>
        )}
        <button onClick={handleSaveGraph} disabled={isSaving || isLoading} style={{
          padding: '5px 10px', backgroundColor: '#4CAF50', color: 'white', border: '1px solid #388E3C',
          borderRadius: '4px', cursor: 'pointer', opacity: (isSaving || isLoading) ? 0.6 : 1
        }} >
          {isSaving ? 'Saving...' : 'Save'}
        </button>
      </div>
      
      {/* Graph Visualization Container */}
      <div 
        id="network-container"
        style={{
          flex: 1, 
          position: 'relative',
          border: '1px solid #ddd',
          backgroundColor: '#f9f9f9'
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
            // Add the node at the drop position
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
          key={key} // Use key to force remount
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
      </div>
    </div>
  );
};

export default NetworkGraph;
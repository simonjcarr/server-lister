'use client'; // This component uses browser APIs and state, so it must be a Client Component

import React, { useEffect, useRef, useState, useCallback } from 'react';
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
  // Simulate loading delay
  await new Promise(resolve => setTimeout(resolve, 500));
  console.log('Loaded default data.');
  return defaultData; // Or return null if loading fails or no data exists
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
      return { shape: 'box', color: { background: '#4CAF50', border: '#2E7D32' }, font: { color: '#ffffff' } };
    case 'client':
      // Using string for color
      return { shape: 'dot', color: '#2196F3', size: 15 }; // No font defined here
    case 'router':
      return { shape: 'diamond', color: { background: '#FF9800', border: '#EF6C00' }, size: 20 }; // No font defined here
    case 'firewall':
      return { shape: 'triangle', color: { background: '#F44336', border: '#C62828' }, size: 20 }; // No font defined here
    case 'switch':
      // Mixed usage for demo
      return { shape: 'box', color: '#9C27B0', size: 18, font: { color: '#ffffff' } };
    case 'cloud':
      return { shape: 'ellipse', color: { background: '#607D8B', border: '#455A64' }, label: 'Cloud' }; // No font defined here
    case 'other':
    default:
      return { shape: 'ellipse', color: { background: '#9E9E9E', border: '#616161' } }; // No font defined here
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

  // Define Node Types for the draggable palette
  const nodeTypes: NodeType[] = ['server', 'client', 'router', 'firewall', 'switch', 'cloud', 'other'];

  // --- Initialization ---
  useEffect(() => {
    // Avoid duplicate initialization if refs are already populated
    // This can sometimes happen with StrictMode or HMR
    if (networkInstanceRef.current || !visJsRef.current) {
      // console.log('Skipping initialization - already initialized or container missing');
      // return; // Or decide how to handle re-init if needed
    }

    let isMounted = true; // Flag to prevent state updates on unmounted component
    let network: Network | null = null; // Hold network instance locally in effect scope

    const initializeGraph = async () => {
      console.log('Initializing graph...');
      setIsLoading(true);
      const initialData = await loadData();

      // Ensure we are still mounted and container exists before proceeding
      if (!isMounted || !visJsRef.current) {
        console.log('Initialization aborted: Component unmounted or container missing');
        return;
      }

      if (initialData) {
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
                nodeType: nodeData.nodeType as NodeType,
                x: nodeData.x, y: nodeData.y,
              };
              const nodeType = cleanNodeData.nodeType && nodeTypes.includes(cleanNodeData.nodeType)
                ? cleanNodeData.nodeType : 'other';
              const updatedNode = {
                ...cleanNodeData, nodeType: nodeType,
                ...getNodeStyle(nodeType)
              } as NetworkNode;
              nodesDataSetRef.current.update(updatedNode);
              callback(updatedNode);
            },
            initiallyActive: false, addNode: false, editEdge: true,
            deleteNode: true, deleteEdge: true
          },
          nodes: {
            font: { size: 14, color: '#333' }, borderWidth: 1,
            shapeProperties: { useBorderWithImage: true }
          },
          edges: {
            arrows: 'to', smooth: { enabled: true, type: "continuous", roundness: 0.5 },
            color: { color: '#848484', highlight: '#575757', hover: '#575757' },
            width: 1, hoverWidth: 1.5
          },
        };

        // Create the Network instance
        network = new Network(
          visJsRef.current,
          { nodes: nodesDataSetRef.current, edges: edgesDataSetRef.current },
          options
        );
        networkInstanceRef.current = network; // Store in ref
        console.log('Network instance created.');

        // --- Event Listeners ---
        network.on('doubleClick', (params) => {
          if (params.nodes.length > 0) {
            const nodeId = params.nodes[0];
            handleEditNode(nodeId);
          }
        });

        // --- Post-Initialization ---
        network.once('stabilizationIterationsDone', () => {
          console.log("Initial stabilization finished.");
          // Check if instance still exists before setting options
          if (networkInstanceRef.current) {
            networkInstanceRef.current.setOptions({ physics: { enabled: false } });
            console.log("Physics disabled for manual positioning.");
          }
        });

      } // End if(visJsRef.current && !network)

      if (isMounted) {
        setIsLoading(false);
      }
    }; // End initializeGraph async function

    initializeGraph();

    // --- Cleanup Function ---
    return () => {
      console.log('Running cleanup...');
      isMounted = false; // Mark as unmounted

      // Use the ref to access the instance created in this effect run
      const currentNetworkInstance = networkInstanceRef.current;

      if (currentNetworkInstance) {
        console.log('Destroying network instance...');
        currentNetworkInstance.destroy();
        networkInstanceRef.current = null; // Clear the ref
        console.log('Network destroyed');

        // *** START OF FIX for removeChild error ***
        // Explicitly clear the container div's content AFTER destroying the network.
        // This helps prevent React's cleanup from conflicting with vis.js's cleanup,
        // especially relevant in React StrictMode's double invocation.
        if (visJsRef.current) {
          visJsRef.current.innerHTML = ''; // Clear children managed by vis.js
          console.log('Vis container cleared');
        }
        // *** END OF FIX ***

      } else {
        console.log('Cleanup: No network instance found to destroy.');
      }
    };
  }, []); // IMPORTANT: Empty dependency array ensures this runs only once on mount and cleanup on unmount

  // --- Interaction Handlers --- (Remain the same as previous version)

  const handleDragStart = (event: React.DragEvent, nodeType: NodeType) => {
    event.dataTransfer.setData('application/reactflow', nodeType); // Use a specific data type
    event.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault(); // Necessary to allow dropping
    event.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    const nodeType = event.dataTransfer.getData('application/reactflow') as NodeType;
    const network = networkInstanceRef.current;

    if (!nodeType || !network || !visJsRef.current) {
      console.error("Drop failed: Missing nodeType, network instance, or container ref.");
      return;
    }
    const canvasRect = visJsRef.current.getBoundingClientRect();
    const pointerX = event.clientX - canvasRect.left;
    const pointerY = event.clientY - canvasRect.top;
    const position = network.DOMtoCanvas({ x: pointerX, y: pointerY });
    const newNode: NetworkNode = {
      id: uuidv4(),
      label: `New ${nodeType.charAt(0).toUpperCase() + nodeType.slice(1)}`,
      nodeType: nodeType, x: position.x, y: position.y,
      ...getNodeStyle(nodeType),
    };
    nodesDataSetRef.current.add(newNode);
  }, []);

  const handleEditNode = useCallback((nodeId: IdType) => {
    const node = nodesDataSetRef.current.get(nodeId);
    if (!node) return;
    const newLabel = prompt(`Edit label for node "${node.label || node.id}":`, node.label || '');
    if (newLabel === null) return;

    let newNodeType = node.nodeType;
    const typeInput = prompt(`Edit type (${nodeTypes.join('/')}):`, node.nodeType);
    if (typeInput !== null && nodeTypes.includes(typeInput as NodeType)) {
      newNodeType = typeInput as NodeType;
    } else if (typeInput !== null) {
      alert(`Invalid type "${typeInput}". Keeping original type "${newNodeType}".`);
    }

    const updatedNodeData: Partial<NetworkNode> = {
      id: nodeId, label: newLabel, nodeType: newNodeType, x: node.x, y: node.y
    };
    const finalNode = { ...updatedNodeData, ...getNodeStyle(newNodeType) } as NetworkNode;
    nodesDataSetRef.current.update(finalNode);
    console.log(`Node ${nodeId} updated:`, finalNode);
  }, []);

  const toggleAddEdgeMode = () => {
    const network = networkInstanceRef.current;
    if (!network) return;
    if (interactionMode === 'addingEdge') {
      network.disableEditMode();
      setInteractionMode('idle');
    } else {
      network.disableEditMode(); // Ensure other modes off first
      network.addEdgeMode();
      setInteractionMode('addingEdge');
    }
  };

  const handleSave = useCallback(async () => {
    if (!nodesDataSetRef.current || !edgesDataSetRef.current) {
      console.error("Cannot save: DataSets not initialized."); return;
    }
    const network = networkInstanceRef.current;
    if (!network) {
      console.error("Cannot save: Network not initialized."); return;
    }
    setIsSaving(true);
    network.storePositions(); // Capture positions
    const nodePositions = network.getPositions();
    const nodesToSave = nodesDataSetRef.current.map((node: NetworkNode) => {
      const position = nodePositions[node.id];
      const cleanNode: NetworkNode = {
        id: node.id, label: node.label || '', nodeType: node.nodeType,
        x: position?.x ?? node.x ?? 0, y: position?.y ?? node.y ?? 0,
      };
      delete cleanNode.color; delete cleanNode.font; delete cleanNode.shape; delete cleanNode.size;
      return cleanNode;
    });
    const edgesToSave = edgesDataSetRef.current.map((edge: NetworkEdge) => {
      const cleanEdge: NetworkEdge = { id: edge.id, from: edge.from, to: edge.to };
      delete cleanEdge.color; delete cleanEdge.width; delete cleanEdge.arrows; delete cleanEdge.smooth;
      return cleanEdge;
    });
    const currentGraphData: GraphData = { nodes: nodesToSave, edges: edgesToSave };
    const success = await saveData(currentGraphData);
    alert(success ? 'Graph saved successfully!' : 'Failed to save graph.');
    setIsSaving(false);
  }, []);


  // --- Render ---
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 100px)', border: '1px solid #ccc', borderRadius: '8px', overflow: 'hidden' }}>
      {/* Toolbar */}
      <div style={{ padding: '10px', borderBottom: '1px solid #ccc', background: '#f5f5f5', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <span>Add Node:</span>
        {nodeTypes.map((type) => {
          const nodeStyleDetails = getNodeStyle(type);
          const colorProp = nodeStyleDetails.color;
          const fontProp = nodeStyleDetails.font;
          let displayBackgroundColor: string | undefined = '#eee';
          if (typeof colorProp === 'string') { displayBackgroundColor = colorProp; }
          else if (typeof colorProp === 'object' && colorProp?.background) { displayBackgroundColor = colorProp.background; }
          let displayFontColor: string | undefined = '#333';
          if (typeof fontProp === 'object' && typeof fontProp?.color === 'string') { displayFontColor = fontProp.color; }

          return (
            <div key={type} draggable onDragStart={(e) => handleDragStart(e, type)}
              style={{
                padding: '5px 10px', border: '1px solid #aaa', borderRadius: '4px', cursor: 'grab',
                backgroundColor: displayBackgroundColor, color: displayFontColor,
                fontSize: '12px', textAlign: 'center', minWidth: '60px', userSelect: 'none'
              }}
              title={`Drag to add a ${type}`} >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </div>
          );
        })}
        {/* Buttons */}
        <button onClick={toggleAddEdgeMode} style={{
          marginLeft: 'auto', padding: '5px 10px',
          backgroundColor: interactionMode === 'addingEdge' ? '#ffc107' : '#e0e0e0',
          border: '1px solid #aaa', borderRadius: '4px', cursor: 'pointer'
        }}
          title={interactionMode === 'addingEdge' ? "Cancel adding edge" : "Add an edge between two nodes"} >
          {interactionMode === 'addingEdge' ? 'Adding Edge...' : 'Add Edge'}
        </button>
        <button onClick={handleSave} disabled={isSaving || isLoading} style={{
          padding: '5px 10px', backgroundColor: '#4CAF50', color: 'white', border: '1px solid #388E3C',
          borderRadius: '4px', cursor: 'pointer', opacity: (isSaving || isLoading) ? 0.6 : 1
        }} >
          {isSaving ? 'Saving...' : 'Save Graph'}
        </button>
      </div>

      {/* Network Canvas */}
      <div ref={visJsRef} style={{ flexGrow: 1, position: 'relative', backgroundColor: '#f9f9f9' }}
        onDragOver={handleDragOver} onDrop={handleDrop} >
        {isLoading && (
          <div style={{
            position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: '#555',
            fontSize: '1.2em', background: 'rgba(255, 255, 255, 0.8)', padding: '10px 20px', borderRadius: '5px'
          }}>
            Loading Network...
          </div>
        )}
      </div>
      {/* Footer/Tip */}
      <div style={{ padding: '5px', fontSize: '12px', background: '#f0f0f0', borderTop: '1px solid #ccc', textAlign: 'center' }}>
        Tip: Drag nodes from toolbar. Double-click node to edit. Use 'Add Edge' button. Select + Delete key to remove.
      </div>
    </div>
  );
};

export default NetworkGraph;
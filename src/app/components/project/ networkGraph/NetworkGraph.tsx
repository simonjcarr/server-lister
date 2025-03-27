"use client";

// src/types.ts
import React, { useEffect, useRef, useState, useCallback } from 'react';
import cytoscape, { Core, ElementDefinition, NodeSingular, EdgeSingular } from 'cytoscape';
import edgehandles, { EdgeHandlesInstance } from 'cytoscape-edgehandles';
import { v4 as uuidv4 } from 'uuid';
import styles from './NetworkGraph.module.css';

// --- Import React Icons ---
import {
  FaServer, FaLaptop, FaRoute, FaShieldAlt, FaDatabase, FaNetworkWired, FaQuestionCircle, FaEthernet // Example icons
} from 'react-icons/fa'; // Using Font Awesome icons, choose any set
import { IconType } from 'react-icons';

// --- Import for SVG rendering ---
// NOTE: Using 'react-dom/server' on the client-side is generally acceptable for this use case (generating static markup).
import { renderToStaticMarkup } from 'react-dom/server';
// Define the specific types of nodes you support
export type NodeType = 'server' | 'client' | 'router' | 'firewall' | 'switch' | 'database' | 'network' | 'other'; // Added 'network'

// Data associated with a node in Cytoscape
export interface NodeData {
  id: string; // Unique ID (UUID recommended)
  label: string;
  type: NodeType;
}

// Data associated with an edge in Cytoscape
export interface EdgeData {
  id: string; // Unique ID (UUID recommended)
  source: string; // ID of the source node
  target: string; // ID of the target node
  label?: string; // Optional edge label
}

// Structure for saving/loading the graph state (suitable for JSONB)
export interface GraphState {
  nodes: NodeData[];
  edges: EdgeData[];
}

// Type for Cytoscape element definitions (useful for initialization)
export type GraphElementDefinition = cytoscape.ElementDefinition;

// Type for the Node Palette items
export interface PaletteNode {
  type: NodeType;
  label: string; // Label shown in the palette
}

const NetworkGraph = () => {
  

  // --- Register Cytoscape extensions ---
  if (typeof window !== 'undefined') {
    try {
      // Check if already registered to prevent warnings/errors during HMR
      if (!(cytoscape as any).prototype.edgehandles) {
        cytoscape.use(edgehandles);
      }
    } catch (e) {
      console.error("Error registering Cytoscape extension:", e);
    }
  }

  // --- Props Interface ---
  interface NetworkGraphProps {
    initialData?: GraphState | null;
    onSave: (data: GraphState) => Promise<void>;
  }

  // --- Stubbed Data Functions (Keep as before) ---
  const loadData = async (): Promise<GraphState | null> => { /* ... */ };
  const saveData = async (data: GraphState): Promise<void> => { /* ... */ };


  // --- Node Palette Configuration ---
  const nodePalette: PaletteNode[] = [
    { type: 'server', label: 'Server' },
    { type: 'client', label: 'Client' },
    { type: 'router', label: 'Router' },
    { type: 'firewall', label: 'Firewall' },
    { type: 'switch', label: 'Switch' }, // Added FaEthernet for switch
    { type: 'database', label: 'Database' },
    { type: 'network', label: 'Network' }, // Added Network
    { type: 'other', label: 'Other' },
  ];

  // --- Icon Mapping ---
  const nodeIcons: Record<NodeType, IconType> = {
    server: FaServer,
    client: FaLaptop,
    router: FaRoute,
    firewall: FaShieldAlt,
    switch: FaEthernet, // Using FaEthernet for switch
    database: FaDatabase,
    network: FaNetworkWired, // Icon for network
    other: FaQuestionCircle,
  };

  // --- Helper to create SVG Data URI ---
  const createSvgDataUri = (iconComponent: IconType, size: number = 32, color: string = '#333'): string => {
    // Render the React icon component to an SVG string
    const svgString = renderToStaticMarkup(React.createElement(iconComponent, { size: size, color: color }));

    // Encode the SVG string for use in a data URI
    // Using encodeURIComponent is generally safer and often results in shorter URIs than Base64
    const dataUri = `data:image/svg+xml;utf8,${encodeURIComponent(svgString)}`;
    return dataUri;
  };

  // --- Generate Data URIs for Icons ---
  // We can memoize this or generate it once outside the component if preferred
  const iconDataUris: Partial<Record<NodeType, string>> = {};
  (Object.keys(nodeIcons) as NodeType[]).forEach(type => {
    const icon = nodeIcons[type];
    if (icon) {
      iconDataUris[type] = createSvgDataUri(icon, 40, '#FFFFFF'); // White icon, adjust size/color
    }
  });


  // --- Cytoscape Stylesheet ---
  const NODE_SIZE = '55px'; // Make nodes slightly larger for icons

  const cyStylesheet = [
    // --- Default Node Style ---
    {
      selector: 'node',
      style: {
        'label': 'data(label)',
        'text-valign': 'bottom',
        'text-halign': 'center',
        'font-size': '10px',
        'color': '#333',
        'text-margin-y': 5, // Space between icon and label
        'width': NODE_SIZE,
        'height': NODE_SIZE,
        'background-color': '#ccc', // Fallback/base color
        'background-fit': 'contain', // Scale icon down to fit node
        'background-clip': 'none', // Draw background over border
        'background-opacity': 1, // Ensure background color is visible unless overridden
        'border-width': 2,
        'border-color': '#666',
        'shape': 'ellipse', // Default shape remains ellipse
      },
    },
    // --- Icon Styles using Data URIs ---
    // Generate styles for each node type dynamically
    ...(Object.keys(iconDataUris) as NodeType[]).map((type) => ({
      selector: `node[type="${type}"]`,
      style: {
        'background-image': iconDataUris[type] || 'none', // Set the data URI
        'background-color': getNodeColor(type), // Assign a background color per type
        'border-color': darkenColor(getNodeColor(type), 0.3), // Darker border based on background
        // Optional: change shape per type if desired
        // 'shape': type === 'router' ? 'rectangle' : 'ellipse',
      }
    })),
    // --- Edge Style (mostly unchanged) ---
    {
      selector: 'edge',
      style: {
        'width': 2,
        'line-color': '#bbb', // Lighter default edge
        'target-arrow-color': '#bbb',
        'target-arrow-shape': 'triangle',
        'curve-style': 'bezier',
        'label': 'data(label)',
        'font-size': '9px',
        'color': '#555',
        'text-rotation': 'autorotate',
        'text-margin-y': -10
      },
    },
    // --- Edge Handles Styles (unchanged) ---
    { selector: '.eh-handle', style: { /* ... */ } },
    { selector: '.eh-source', style: { /* ... */ } },
    { selector: '.eh-target', style: { /* ... */ } },
    { selector: '.eh-preview, .eh-ghost-edge', style: { /* ... */ } },
    // --- Selection Styles ---
    {
      selector: 'node:selected',
      style: {
        'border-width': 4,
        'border-color': '#333',
        'background-blacken': -0.1, // Slightly darken background on select
      }
    },
    {
      selector: 'edge:selected',
      style: {
        'line-color': '#666',
        'target-arrow-color': '#666',
        'width': 3
      }
    },
  ];

  // --- Helper functions for colors (optional, for better visuals) ---
  function getNodeColor(type: NodeType): string {
    switch (type) {
      case 'server': return '#d9534f'; // Reddish
      case 'client': return '#5bc0de'; // Light Blue
      case 'router': return '#5cb85c'; // Green
      case 'firewall': return '#f0ad4e'; // Orange
      case 'switch': return '#428bca'; // Blue
      case 'database': return '#9954bb'; // Purple
      case 'network': return '#777777'; // Gray
      case 'other': return '#aaaaaa'; // Light Gray
      default: return '#cccccc';
    }
  }

  function darkenColor(hex: string, factor: number): string {
    let r = parseInt(hex.slice(1, 3), 16);
    let g = parseInt(hex.slice(3, 5), 16);
    let b = parseInt(hex.slice(5, 7), 16);
    factor = 1 - Math.max(0, Math.min(1, factor)); // Ensure factor is between 0 and 1
    r = Math.floor(r * factor);
    g = Math.floor(g * factor);
    b = Math.floor(b * factor);
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }


  // --- The React Component (Structure remains largely the same) ---
  const NetworkGraph: React.FC<NetworkGraphProps> = ({ initialData: propInitialData, onSave }) => {
    const cyContainerRef = useRef<HTMLDivElement>(null);
    const cyInstanceRef = useRef<Core | null>(null);
    const ehInstanceRef = useRef<EdgeHandlesInstance | null>(null);

    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [editingNode, setEditingNode] = useState<NodeSingular | null>(null);
    const [editFormData, setEditFormData] = useState<{ label: string; type: NodeType }>({ label: '', type: 'other' });

    // --- Initialization `useEffect` (Cytoscape setup) ---
    useEffect(() => {
      let cy: Core | null = null;

      const initializeGraph = async () => {
        setIsLoading(true);
        let dataToLoad: GraphState | null = propInitialData ?? null;

        if (!dataToLoad) {
          try { dataToLoad = await loadData(); }
          catch (error) { console.error("Error loading initial data:", error); }
        }

        if (cyContainerRef.current) {
          const elements: GraphElementDefinition[] = [];
          if (dataToLoad) {
            elements.push(...dataToLoad.nodes.map(n => ({ data: n, group: 'nodes' as const })));
            elements.push(...dataToLoad.edges.map(e => ({ data: e, group: 'edges' as const })));
          }

          cy = cytoscape({
            container: cyContainerRef.current,
            elements: elements,
            style: cyStylesheet, // Use the updated stylesheet
            layout: {
              name: 'cose',
              animate: true,
              padding: 50,
              nodeRepulsion: () => 400000,
              idealEdgeLength: () => 120, // Increased length slightly
              nodeOverlap: 20,
            },
            wheelSensitivity: 0.2
          });

          cyInstanceRef.current = cy;

          // Initialize edge handles (keep as before)
          ehInstanceRef.current = cy.edgehandles({ /* ... edgehandles options ... */
            preview: true,
            handleNodes: 'node',
            handleSize: 10,
            handleColor: '#ff0000',
            edgeType: () => 'flat',
            loopAllowed: () => false,
            complete: (sourceNode, targetNode, addedEles) => {
              const newEdge = addedEles.first();
              if (newEdge.isEdge()) {
                const edgeData: EdgeData = {
                  id: uuidv4(),
                  source: sourceNode.id(),
                  target: targetNode.id(),
                };
                newEdge.data(edgeData);
                console.log('Edge created:', edgeData);
              }
            },
          });


          // --- Event Listeners (Keep as before) ---
          cy.on('dblclick', 'node', (event) => { handleEditNode(event.target); });

          const handleResize = () => { cy?.resize(); cy?.fit(undefined, 50); };
          window.addEventListener('resize', handleResize);

          return () => { // Cleanup
            console.log("Cleaning up Cytoscape instance");
            ehInstanceRef.current?.destroy();
            cy?.destroy();
            cyInstanceRef.current = null;
            ehInstanceRef.current = null;
            window.removeEventListener('resize', handleResize);
          };
        }
      };

      initializeGraph().finally(() => setIsLoading(false));

      return () => { // Ensure cleanup on unmount
        console.log("Component unmounting - ensuring cleanup");
        ehInstanceRef.current?.destroy();
        cyInstanceRef.current?.destroy();
        cyInstanceRef.current = null;
        ehInstanceRef.current = null;
        // No need to remove resize listener here if it's done in initializeGraph's return
      };
    }, [propInitialData]);


    // --- Drag and Drop Handlers (Keep as before) ---
    const handleDragStart = (event: React.DragEvent<HTMLDivElement>, nodeType: NodeType) => { /* ... */ };
    const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => { /* ... */ };
    const handleDrop = (event: React.DragEvent<HTMLDivElement>) => { /* ... Logic to add node ... */
      event.preventDefault();
      const cy = cyInstanceRef.current;
      if (!cy || !cyContainerRef.current) return;

      const nodeType = event.dataTransfer.getData('application/reactflow') as NodeType;
      if (!nodeType) return;

      const bounds = cyContainerRef.current.getBoundingClientRect();
      const position = cy.renderer().projectIntoModelPosition([
        event.clientX - bounds.left,
        event.clientY - bounds.top
      ]);

      const newNodeData: NodeData = {
        id: uuidv4(),
        label: nodeType.charAt(0).toUpperCase() + nodeType.slice(1),
        type: nodeType,
      };

      cy.add({ group: 'nodes', data: newNodeData, position: position });
      console.log('Node added:', newNodeData);
    };

    // --- Node Editing Handlers (Keep as before) ---
    const handleEditNode = (node: NodeSingular) => { /* ... */ };
    const handleEditFormChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => { /* ... */ };
    const handleCancelEdit = () => { /* ... */ };
    const handleSaveEdit = () => {
      if (!editingNode || !cyInstanceRef.current) return;

      const { label, type } = editFormData;
      const nodeToUpdate = cyInstanceRef.current.getElementById(editingNode.id());

      if (nodeToUpdate.isNode()) {
        // Update data - Cytoscape will automatically re-apply styles based on the new 'type'
        nodeToUpdate.data({ label, type });
        console.log('Node updated:', nodeToUpdate.data());
      }

      setEditingNode(null); // Close modal
    };


    // --- Saving Handler (Keep as before) ---
    const handleSaveGraph = useCallback(async () => { /* ... */ }, [onSave]);


    return (
      <div className={styles.graphContainerWrapper}>
        {/* Node Palette (includes 'Network') */}
        <div className={styles.palette}>
          <h3>Add Nodes</h3>
          {nodePalette.map((nodeInfo) => (
            <div
              key={nodeInfo.type}
              className={styles.paletteNode}
              draggable
              onDragStart={(e) => handleDragStart(e, nodeInfo.type)}
              title={`Drag to add ${nodeInfo.label}`}
              // Optional: Add small icon preview in palette
              style={{
                // Use inline style for simplicity here, or create dedicated classes
                // '--node-color': getNodeColor(nodeInfo.type) // Example CSS variable
              }}
            >
              {/* You could add a small icon here too if desired */}
              {/* React.createElement(nodeIcons[nodeInfo.type], { size: 16 }) */}
              {nodeInfo.label} ({nodeInfo.type})
            </div>
          ))}
        </div>

        {/* Cytoscape Canvas */}
        <div
          className={styles.cyContainer}
          ref={cyContainerRef}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          {isLoading && <div className={styles.loadingOverlay}>Loading Graph...</div>}
        </div>

        {/* Controls (Save Button, Instructions) */}
        <div className={styles.controls}>
          {/* ... button and instructions ... */}
          <button onClick={handleSaveGraph} disabled={isLoading || isSaving}>
            {isSaving ? 'Saving...' : 'Save Graph'}
          </button>
          <p className={styles.instructions}>
            Drag nodes. Drag handle to connect. Double-click node to edit.
          </p>
        </div>

        {/* Editing Modal (ensure 'network' is in the dropdown) */}
        {editingNode && (
          <div className={styles.editModalOverlay}>
            <div className={styles.editModal}>
              <h3>Edit Node: {editingNode.data('label')}</h3>
              <label>
                Label:
                <input
                  type="text"
                  name="label"
                  value={editFormData.label}
                  onChange={handleEditFormChange}
                />
              </label>
              <label>
                Type:
                <select
                  name="type"
                  value={editFormData.type}
                  onChange={handleEditFormChange}
                >
                  {/* Ensure all types from nodePalette are options */}
                  {nodePalette.map(p => (
                    <option key={p.type} value={p.type}>{p.label}</option>
                  ))}
                </select>
              </label>
              <div className={styles.editModalButtons}>
                <button onClick={handleSaveEdit}>Save Changes</button>
                <button onClick={handleCancelEdit}>Cancel</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  export default NetworkGraph
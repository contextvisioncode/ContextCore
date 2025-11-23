"use client";

import { useState, useCallback, useEffect } from "react";
import ReactFlow, {
    Background,
    Controls,
    MiniMap,
    useNodesState,
    useEdgesState,
    Node,
    Edge,
    Panel,
    ReactFlowProvider
} from "reactflow";
import "reactflow/dist/style.css";
import { Layers, Filter, Maximize2, Minimize2, Settings, Eye, EyeOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// --- Types ---
type ArchitectureMapProps = {
    initialNodes: Node[];
    initialEdges: Edge[];
    onNodeClick: (event: React.MouseEvent, node: Node) => void;
    isFullScreen: boolean;
    onToggleFullScreen: () => void;
};

const nodeColor = (node: Node) => {
    switch (node.type) {
        case 'input': return '#6366f1'; // Indigo
        case 'output': return '#ec4899'; // Pink
        default: return '#06b6d4'; // Cyan
    }
};

export function ArchitectureMap({
    initialNodes,
    initialEdges,
    onNodeClick,
    isFullScreen,
    onToggleFullScreen
}: ArchitectureMapProps) {
    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
    const [filterMode, setFilterMode] = useState<'all' | 'components' | 'core'>('all');
    const [hoveredNode, setHoveredNode] = useState<string | null>(null);

    // Update nodes when props change
    useEffect(() => {
        setNodes(initialNodes);
        setEdges(initialEdges);
    }, [initialNodes, initialEdges, setNodes, setEdges]);

    // Filtering Logic
    useEffect(() => {
        const filteredNodes = initialNodes.map(node => {
            let isVisible = true;
            const label = (node.data?.label || "").toLowerCase();

            if (filterMode === 'components') {
                // Show only likely components (capitalized or tsx)
                isVisible = label.includes('.tsx') || /^[A-Z]/.test(label);
            } else if (filterMode === 'core') {
                // Show only core config files
                isVisible = label.includes('config') || label.includes('json') || label.includes('env');
            }

            return {
                ...node,
                hidden: !isVisible
            };
        });

        setNodes(filteredNodes);
    }, [filterMode, initialNodes, setNodes]);

    // Highlight Logic
    useEffect(() => {
        if (!hoveredNode) {
            setNodes((nds) => nds.map((n) => ({ ...n, style: { ...n.style, opacity: 1 } })));
            setEdges((eds) => eds.map((e) => ({ ...e, style: { ...e.style, opacity: 1, stroke: '#64748b' } })));
            return;
        }

        // Find connected nodes
        const connectedEdges = initialEdges.filter(
            (e) => e.source === hoveredNode || e.target === hoveredNode
        );
        const connectedNodeIds = new Set(
            connectedEdges.flatMap((e) => [e.source, e.target])
        );
        connectedNodeIds.add(hoveredNode);

        setNodes((nds) => nds.map((n) => ({
            ...n,
            style: {
                ...n.style,
                opacity: connectedNodeIds.has(n.id) ? 1 : 0.2,
                transition: 'opacity 0.2s'
            }
        })));

        setEdges((eds) => eds.map((e) => ({
            ...e,
            style: {
                ...e.style,
                opacity: (e.source === hoveredNode || e.target === hoveredNode) ? 1 : 0.1,
                stroke: (e.source === hoveredNode || e.target === hoveredNode) ? '#6366f1' : '#64748b',
                strokeWidth: (e.source === hoveredNode || e.target === hoveredNode) ? 2 : 1
            }
        })));

    }, [hoveredNode, initialEdges, setNodes, setEdges]);

    return (
        <div className="w-full h-full bg-slate-900/50 backdrop-blur-sm rounded-xl overflow-hidden border border-white/10 relative group">
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onNodeClick={onNodeClick}
                onNodeMouseEnter={(_, node) => setHoveredNode(node.id)}
                onNodeMouseLeave={() => setHoveredNode(null)}
                fitView
                minZoom={0.1}
                maxZoom={2}
                className="bg-transparent"
            >
                <Background color="#6366f1" gap={30} size={1} className="opacity-20" />
                <Controls className="bg-slate-800 border border-white/10 text-white" />
                <MiniMap
                    nodeColor={nodeColor}
                    maskColor="rgba(0, 0, 0, 0.6)"
                    className="bg-slate-900 border border-white/10 rounded-lg overflow-hidden"
                />

                {/* Control Panel */}
                <Panel position="top-left" className="bg-slate-900/90 backdrop-blur-md border border-white/10 p-2 rounded-lg flex flex-col gap-2 shadow-xl">
                    <div className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-1 px-2">Filters</div>
                    <div className="flex gap-1">
                        <FilterButton
                            active={filterMode === 'all'}
                            onClick={() => setFilterMode('all')}
                            label="All"
                            icon={Layers}
                        />
                        <FilterButton
                            active={filterMode === 'components'}
                            onClick={() => setFilterMode('components')}
                            label="Components"
                            icon={Filter}
                        />
                        <FilterButton
                            active={filterMode === 'core'}
                            onClick={() => setFilterMode('core')}
                            label="Config"
                            icon={Settings}
                        />
                    </div>
                </Panel>

                <Panel position="top-right">
                    <button
                        onClick={onToggleFullScreen}
                        className="bg-slate-900/90 hover:bg-indigo-600/20 text-white border border-white/10 p-2 rounded-lg transition-all"
                        title={isFullScreen ? "Exit Full Screen" : "Enter Full Screen"}
                    >
                        {isFullScreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
                    </button>
                </Panel>
            </ReactFlow>
        </div>
    );
}

const FilterButton = ({ active, onClick, label, icon: Icon }: any) => (
    <button
        onClick={onClick}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${active
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
            }`}
    >
        <Icon className="w-3 h-3" />
        {label}
    </button>
);

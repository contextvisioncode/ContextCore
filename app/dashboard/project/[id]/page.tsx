"use client";

import { useState, useEffect, use, useCallback } from "react";
import {
    useNodesState,
    useEdgesState,
    Node
} from "reactflow";
import "reactflow/dist/style.css";
import { Code2, X, FileCode, Activity } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { SystemBoot } from "@/components/dashboard/SystemBoot";
import { AuroraBackground } from "@/components/ui/AuroraBackground";
import { ProjectDNA } from "@/components/dashboard/ProjectDNA";
import { NeuralChat } from "@/components/dashboard/NeuralChat";
import { IntelligenceBriefing } from "@/components/dashboard/IntelligenceBriefing";
import { TacticalGrid } from "@/components/dashboard/TacticalGrid";
import { ArchitectureMap } from "@/components/dashboard/ArchitectureMap";
import { MissionGuide } from "@/components/dashboard/MissionGuide";
import { motion, AnimatePresence } from "framer-motion";

// --- Types ---
type Message = {
    role: "user" | "model";
    text: string;
};

type ProjectStatus = "pending" | "processing" | "completed" | "failed";

export default function DashboardPage({ params }: { params: Promise<{ id: string }> }) {
    const { id: projectId } = use(params);
    const [status, setStatus] = useState<ProjectStatus>("pending");
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [errorLog, setErrorLog] = useState<any>(null);
    const [showBoot, setShowBoot] = useState(true);
    const [summary, setSummary] = useState<string | null>(null);
    const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
    const [isGraphMode, setIsGraphMode] = useState(false);
    const [selectedNode, setSelectedNode] = useState<Node | null>(null);

    // React Flow State
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);

    // Poll Project Status & Graph
    useEffect(() => {
        let intervalId: NodeJS.Timeout;

        const fetchProject = async () => {
            try {
                const { data, error } = await supabase
                    .from("projects")
                    .select("*")
                    .eq("id", projectId)
                    .single();

                if (error) {
                    console.error("Error fetching project:", error);
                    return;
                }

                if (data) {
                    setStatus(data.status as ProjectStatus);

                    if (data.status === "completed" && data.graph_json) {
                        setNodes(data.graph_json.nodes || []);
                        setEdges(data.graph_json.edges || []);
                        clearInterval(intervalId);
                    } else if (data.status === "failed") {
                        if (data.error_log) {
                            try {
                                setErrorLog(JSON.parse(data.error_log));
                            } catch (e) {
                                setErrorLog({ message: "Unknown error occurred" });
                            }
                        }
                        clearInterval(intervalId);
                    }
                }
            } catch (err) {
                console.error("Polling error:", err);
            }
        };

        fetchProject();
        intervalId = setInterval(fetchProject, 2000);
        return () => clearInterval(intervalId);
    }, [projectId, setNodes, setEdges]);

    const sendMessageToChat = async (text: string, isSystemPrompt: boolean = false) => {
        if (!isSystemPrompt) {
            setMessages((prev) => [...prev, { role: "user", text }]);
        }

        setIsLoading(true);

        try {
            const response = await fetch("http://localhost:3001/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ projectId, message: text, history: [] }),
            });

            if (!response.body) throw new Error("No response body");

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let botMsg = "";

            if (!isSystemPrompt) {
                setMessages((prev) => [...prev, { role: "model", text: "" }]);
            }

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                const chunk = decoder.decode(value);
                botMsg += chunk;

                if (!isSystemPrompt) {
                    setMessages((prev) => {
                        const newHistory = [...prev];
                        // Ensure the last message is from the model before updating
                        if (newHistory.length > 0 && newHistory[newHistory.length - 1].role === "model") {
                            newHistory[newHistory.length - 1].text = botMsg;
                        }
                        return newHistory;
                    });
                }
            }
            return botMsg;
        } catch (error) {
            console.error("Chat error:", error);
            if (!isSystemPrompt) {
                setMessages((prev) => [...prev, { role: "model", text: "Error connecting to ContextCore." }]);
            }
            return null;
        } finally {
            setIsLoading(false);
        }
    };

    const handleGenerateBriefing = async () => {
        setIsGeneratingSummary(true);
        const prompt = "Generate a concise, high-level executive summary of this project based on the files analyzed. Focus on purpose, tech stack, and key architectural features. Keep it under 100 words.";
        const result = await sendMessageToChat(prompt, true);
        if (result) {
            setSummary(result);
        }
        setIsGeneratingSummary(false);
    };

    const handleTacticalTrigger = (prompt: string) => {
        sendMessageToChat(prompt, false);
    };

    const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
        setSelectedNode(node);
    }, []);

    if (showBoot) {
        return <SystemBoot onComplete={() => setShowBoot(false)} />;
    }

    return (
        <AuroraBackground className="h-screen w-full overflow-hidden">
            <MissionGuide />
            <div className="relative w-full h-full flex">

                {/* Layer 0: The Universe (Graph Background) */}
                <div className={`absolute inset-0 z-0 transition-all duration-500 ${isGraphMode ? 'opacity-100 z-50 bg-slate-900/95 backdrop-blur-sm' : 'opacity-20 pointer-events-auto'}`}>
                    <ArchitectureMap
                        initialNodes={nodes}
                        initialEdges={edges}
                        onNodeClick={onNodeClick}
                        isFullScreen={isGraphMode}
                        onToggleFullScreen={() => setIsGraphMode(!isGraphMode)}
                    />

                    {/* Node Details Modal */}
                    <AnimatePresence>
                        {selectedNode && isGraphMode && (
                            <motion.div
                                initial={{ x: 300, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                exit={{ x: 300, opacity: 0 }}
                                className="absolute top-4 right-4 bottom-4 w-80 bg-slate-900/95 backdrop-blur-xl border border-indigo-500/30 rounded-xl p-6 z-50 shadow-2xl overflow-y-auto"
                            >
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-2 text-indigo-400">
                                        <FileCode className="w-5 h-5" />
                                        <span className="font-mono font-bold text-sm">TECH SHEET</span>
                                    </div>
                                    <button
                                        onClick={() => setSelectedNode(null)}
                                        className="text-gray-400 hover:text-white transition-colors"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                <div className="space-y-6">
                                    <div>
                                        <label className="text-[10px] uppercase tracking-widest text-gray-500 font-mono">Component Name</label>
                                        <h3 className="text-xl font-bold text-white mt-1 break-all">{selectedNode.data.label}</h3>
                                    </div>

                                    <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-lg">
                                        <div className="flex items-center gap-2 text-indigo-300 mb-2">
                                            <Activity className="w-4 h-4" />
                                            <span className="text-xs font-bold uppercase">AI Analysis</span>
                                        </div>
                                        <p className="text-xs text-gray-300 leading-relaxed">
                                            This component appears to be a critical part of the system architecture.
                                            Based on its connections, it likely handles data flow between
                                            <span className="text-white font-bold mx-1">{edges.filter(e => e.source === selectedNode.id).length}</span>
                                            downstream nodes and
                                            <span className="text-white font-bold mx-1">{edges.filter(e => e.target === selectedNode.id).length}</span>
                                            upstream dependencies.
                                        </p>
                                    </div>

                                    <div>
                                        <label className="text-[10px] uppercase tracking-widest text-gray-500 font-mono">Metrics</label>
                                        <div className="grid grid-cols-2 gap-2 mt-2">
                                            <div className="bg-slate-800 p-2 rounded border border-slate-700">
                                                <div className="text-[10px] text-gray-400">Complexity</div>
                                                <div className="text-sm font-mono text-yellow-400">MEDIUM</div>
                                            </div>
                                            <div className="bg-slate-800 p-2 rounded border border-slate-700">
                                                <div className="text-[10px] text-gray-400">Type</div>
                                                <div className="text-sm font-mono text-cyan-400">{selectedNode.type || 'Default'}</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Layer 1: Mission Control Interface */}
                <div className={`relative z-10 w-full h-full flex p-6 gap-6 pointer-events-none transition-all duration-500 ${isGraphMode ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>

                    {/* Left Column: System Status (20%) */}
                    <div className="w-[20%] flex flex-col gap-6 pointer-events-auto">
                        <div className="flex items-center gap-2">
                            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                                <Code2 className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="font-bold text-xl tracking-tight text-white leading-none">ContextCore</h1>
                                <span className="text-[10px] font-mono text-cyan-400 tracking-widest">MISSION CONTROL</span>
                            </div>
                        </div>

                        <div id="mission-dna">
                            <ProjectDNA nodes={nodes} edges={edges} />
                        </div>

                        {/* Map Toggle Button */}
                        <button
                            id="mission-map-toggle"
                            onClick={() => setIsGraphMode(true)}
                            className="bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 p-3 rounded-xl text-left group transition-all"
                        >
                            <div className="text-xs font-mono text-indigo-300 mb-1 group-hover:text-indigo-200">VIEW MODE</div>
                            <div className="text-sm font-bold text-white flex items-center justify-between">
                                ARCHITECTURE MAP
                                <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" />
                            </div>
                        </button>

                        <div className="mt-auto bg-black/40 backdrop-blur-md border border-white/10 rounded-xl p-4">
                            <h3 className="text-xs font-mono text-gray-500 mb-2">CONNECTION STATUS</h3>
                            <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${status === 'completed' ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'}`} />
                                <span className="text-sm font-mono text-white uppercase">{status}</span>
                            </div>
                            {status === "failed" && (
                                <div className="mt-2 text-[10px] text-red-400 font-mono bg-red-950/30 p-2 rounded border border-red-900/50">
                                    ERROR DETECTED. CHECK LOGS.
                                    {errorLog && (
                                        <div className="mt-1 opacity-70">
                                            {errorLog.message}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Center Column: Intelligence & Tactics (50%) */}
                    <div className="w-[50%] flex flex-col gap-6 pointer-events-auto overflow-y-auto pr-2 scrollbar-none">
                        <div id="mission-briefing">
                            <IntelligenceBriefing
                                summary={summary}
                                onGenerate={handleGenerateBriefing}
                                isGenerating={isGeneratingSummary}
                            />
                        </div>

                        <div className="flex flex-col gap-4" id="mission-tactics">
                            <div className="flex items-center gap-2 border-b border-white/10 pb-2">
                                <div className="w-2 h-2 bg-cyan-500 rotate-45" />
                                <h2 className="font-mono text-sm font-bold text-white tracking-widest">TACTICAL OPERATIONS</h2>
                            </div>
                            <TacticalGrid onTrigger={handleTacticalTrigger} />
                        </div>
                    </div>

                    {/* Right Column: Neural Link (30%) */}
                    <div className="w-[30%] h-full pointer-events-auto" id="mission-chat">
                        <div className="h-full rounded-2xl overflow-hidden border border-white/10 bg-black/20 backdrop-blur-md shadow-2xl">
                            <NeuralChat
                                messages={messages}
                                onSendMessage={(msg) => sendMessageToChat(msg, false)}
                                isLoading={isLoading}
                                status={status}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </AuroraBackground>
    );
}

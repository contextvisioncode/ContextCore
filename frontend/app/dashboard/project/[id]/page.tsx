"use client";

import { useState, useEffect, use } from "react";
import ReactFlow, {
    Background,
    Controls,
    useNodesState,
    useEdgesState,
} from "reactflow";
import "reactflow/dist/style.css";
import { Code2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { SystemBoot } from "@/components/dashboard/SystemBoot";
import { AuroraBackground } from "@/components/ui/AuroraBackground";
import { ProjectDNA } from "@/components/dashboard/ProjectDNA";
import { NeuralChat } from "@/components/dashboard/NeuralChat";
import { IntelligenceBriefing } from "@/components/dashboard/IntelligenceBriefing";
import { TacticalGrid } from "@/components/dashboard/TacticalGrid";

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

    if (showBoot) {
        return <SystemBoot onComplete={() => setShowBoot(false)} />;
    }

    return (
        <AuroraBackground className="h-screen w-full overflow-hidden">
            <div className="relative w-full h-full flex">

                {/* Layer 0: The Universe (Graph Background) */}
                <div className={`absolute inset-0 z-0 transition-all duration-500 ${isGraphMode ? 'opacity-100 z-50 bg-slate-900/90 backdrop-blur-sm' : 'opacity-20 pointer-events-auto'}`}>
                    <ReactFlow
                        nodes={nodes}
                        edges={edges}
                        onNodesChange={onNodesChange}
                        onEdgesChange={onEdgesChange}
                        fitView
                        className="bg-transparent"
                        minZoom={0.1}
                        maxZoom={2}
                    >
                        <Background color="#6366f1" gap={50} size={1} />
                        <Controls />
                    </ReactFlow>

                    {/* Graph Mode Controls */}
                    {isGraphMode && (
                        <div className="absolute top-4 right-4 z-50">
                            <button
                                onClick={() => setIsGraphMode(false)}
                                className="bg-red-500/20 hover:bg-red-500/40 text-red-200 border border-red-500/50 px-4 py-2 rounded-lg backdrop-blur-md transition-all font-mono text-xs uppercase tracking-widest flex items-center gap-2"
                            >
                                Close Map View
                            </button>
                        </div>
                    )}
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

                        <ProjectDNA nodes={nodes} edges={edges} />

                        {/* Map Toggle Button */}
                        <button
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
                        <IntelligenceBriefing
                            summary={summary}
                            onGenerate={handleGenerateBriefing}
                            isGenerating={isGeneratingSummary}
                        />

                        <div className="flex flex-col gap-4">
                            <div className="flex items-center gap-2 border-b border-white/10 pb-2">
                                <div className="w-2 h-2 bg-cyan-500 rotate-45" />
                                <h2 className="font-mono text-sm font-bold text-white tracking-widest">TACTICAL OPERATIONS</h2>
                            </div>
                            <TacticalGrid onTrigger={handleTacticalTrigger} />
                        </div>
                    </div>

                    {/* Right Column: Neural Link (30%) */}
                    <div className="w-[30%] h-full pointer-events-auto">
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

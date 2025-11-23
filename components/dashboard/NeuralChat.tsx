"use client";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Cpu, Bot, User, Sparkles, Wand2, Download, Zap, FileJson, Baby, GraduationCap } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { enhancePrompt, IDE_OPTIONS, type TargetIDE, generateRuleFileContent } from "@/lib/promptEnhancer";

const QUICK_ACTIONS = [
    { label: "🕵️ Find Bugs", prompt: "Analyze the codebase for potential bugs and security vulnerabilities." },
    { label: "📝 Generate README", prompt: "Create a comprehensive README.md for this project." },
    { label: "🎨 UI Improvements", prompt: "Suggest UI/UX improvements based on the current design." },
    { label: "🚀 How to Run", prompt: "Explain step-by-step how to run this project locally." }
];

export const NeuralChat = ({
    messages,
    onSendMessage,
    isLoading,
    status
}: {
    messages: any[];
    onSendMessage: (msg: string) => void;
    isLoading: boolean;
    status: string;
}) => {
    const [input, setInput] = useState("");
    const [selectedIDE, setSelectedIDE] = useState<TargetIDE>('Generic');
    const [isBeginnerMode, setIsBeginnerMode] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = () => {
        if (!input.trim()) return;

        let finalMessage = input;
        if (isBeginnerMode) {
            finalMessage += "\n\n[SYSTEM INSTRUCTION: Explain this simply, using analogies and avoiding technical jargon where possible. Assume the user is a beginner.]";
        }

        onSendMessage(finalMessage);
        setInput("");
    };

    const handleEnhance = () => {
        if (!input.trim()) return;
        const enhanced = enhancePrompt(input, selectedIDE);
        setInput(enhanced);
    };

    const handleQuickAction = (prompt: string) => {
        setInput(prompt);
    };

    const handleDownloadContext = async () => {
        try {
            const element = document.createElement("a");
            const file = new Blob(["<!-- ContextCode XML Content would be here -->\n<root>...</root>"], { type: 'text/xml' });
            element.href = URL.createObjectURL(file);
            element.download = "contextcode.xml";
            document.body.appendChild(element);
            element.click();
            document.body.removeChild(element);
        } catch (error) {
            console.error("Download failed", error);
        }
    };

    const handleExportRules = () => {
        const { filename, content } = generateRuleFileContent(selectedIDE, "Project Context Summary Placeholder");
        const element = document.createElement("a");
        const file = new Blob([content], { type: 'text/plain' });
        element.href = URL.createObjectURL(file);
        element.download = filename;
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
            className="flex flex-col h-full bg-black/40 backdrop-blur-xl border-l border-white/10"
        >
            {/* Header */}
            <div className="p-4 border-b border-white/10 bg-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-ping absolute inset-0" />
                        <div className="w-2 h-2 bg-green-500 rounded-full relative" />
                    </div>
                    <div>
                        <h2 className="font-mono text-sm font-bold text-white tracking-wider">NEURAL LINK</h2>
                        <p className="text-[10px] text-cyan-400 font-mono">SECURE CONNECTION ESTABLISHED</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setIsBeginnerMode(!isBeginnerMode)}
                        className={cn(
                            "p-2 rounded-lg transition-colors",
                            isBeginnerMode ? "bg-pink-500/20 text-pink-400" : "hover:bg-white/10 text-gray-400"
                        )}
                        title={isBeginnerMode ? "Beginner Mode: ON" : "Beginner Mode: OFF"}
                    >
                        {isBeginnerMode ? <Baby className="w-4 h-4" /> : <GraduationCap className="w-4 h-4" />}
                    </button>
                    <button
                        onClick={handleDownloadContext}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors text-cyan-400"
                        title="Download Context XML"
                    >
                        <Download className="w-4 h-4" />
                    </button>
                    <Cpu className="w-5 h-5 text-white/20" />
                </div>
            </div>

            {/* Messages Area */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                {messages.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-center opacity-50 space-y-4">
                        <div className="w-16 h-16 rounded-full bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20">
                            <Bot className="w-8 h-8 text-cyan-400" />
                        </div>
                        <div className="space-y-1">
                            <p className="text-sm font-mono text-cyan-200">SYSTEM READY</p>
                            <p className="text-xs text-gray-400 max-w-[200px]">Awaiting input to analyze architectural patterns.</p>
                        </div>

                        {/* Quick Actions Grid */}
                        <div className="grid grid-cols-2 gap-2 mt-4 w-full max-w-xs">
                            {QUICK_ACTIONS.map((action, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => handleQuickAction(action.prompt)}
                                    className="flex items-center gap-2 p-2 rounded bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-left transition-all group"
                                >
                                    <span className="text-lg">{action.label.split(' ')[0]}</span>
                                    <span className="text-gray-300 group-hover:text-white">{action.label.split(' ').slice(1).join(' ')}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                <AnimatePresence mode="popLayout">
                    {messages.map((msg, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            className={cn(
                                "flex gap-3 max-w-[90%]",
                                msg.role === "user" ? "ml-auto flex-row-reverse" : ""
                            )}
                        >
                            <div className={cn(
                                "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border",
                                msg.role === "user"
                                    ? "bg-indigo-500/20 border-indigo-500/50 text-indigo-400"
                                    : "bg-cyan-500/20 border-cyan-500/50 text-cyan-400"
                            )}>
                                {msg.role === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                            </div>

                            <div className={cn(
                                "p-3 rounded-lg text-sm border backdrop-blur-md",
                                msg.role === "user"
                                    ? "bg-indigo-950/30 border-indigo-500/20 text-indigo-100 rounded-tr-none"
                                    : "bg-cyan-950/30 border-cyan-500/20 text-cyan-100 rounded-tl-none"
                            )}>
                                <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                                {msg.role === "model" && (
                                    <div className="mt-2 flex items-center gap-1 opacity-50">
                                        <Sparkles className="w-3 h-3" />
                                        <span className="text-[10px] font-mono">AI GENERATED</span>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {isLoading && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex gap-3"
                    >
                        <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-500/50 flex items-center justify-center shrink-0">
                            <Bot className="w-4 h-4 text-cyan-400" />
                        </div>
                        <div className="flex items-center gap-1 h-8">
                            <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                            <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                            <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" />
                        </div>
                    </motion.div>
                )}
            </div>

            {/* Prompt Enhancer Toolbar */}
            <div id="mission-chat-export" className="px-4 py-2 bg-black/30 border-t border-white/5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider">Target IDE:</span>
                    <select
                        value={selectedIDE}
                        onChange={(e) => setSelectedIDE(e.target.value as TargetIDE)}
                        className="bg-white/5 border border-white/10 rounded px-2 py-1 text-xs text-cyan-300 font-mono focus:outline-none focus:border-cyan-500/50"
                    >
                        {IDE_OPTIONS.map((opt) => (
                            <option key={opt} value={opt} className="bg-gray-900 text-white">
                                {opt}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={handleExportRules}
                        className="flex items-center gap-1.5 px-3 py-1 rounded bg-white/5 border border-white/10 text-gray-300 text-xs font-mono hover:bg-white/10 transition-all"
                        title={`Export ${selectedIDE} Rules`}
                    >
                        <FileJson className="w-3 h-3" />
                        <span className="hidden sm:inline">EXPORT RULES</span>
                    </button>

                    <button
                        onClick={handleEnhance}
                        disabled={!input.trim()}
                        className="flex items-center gap-1.5 px-3 py-1 rounded bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-mono hover:bg-indigo-500/30 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    >
                        <Wand2 className="w-3 h-3" />
                        <span>ENHANCE</span>
                    </button>
                </div>
            </div>

            {/* Input Area */}
            <div id="mission-chat-input" className="p-4 border-t border-white/10 bg-black/20">
                <div className="relative flex items-center">
                    <input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSend()}
                        placeholder={status === "completed" ? "Enter command..." : "System processing..."}
                        disabled={status !== "completed"}
                        className="w-full bg-white/5 border border-white/10 rounded-lg pl-4 pr-12 py-3 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-cyan-500/50 focus:bg-white/10 transition-all font-mono"
                    />
                    <button
                        onClick={handleSend}
                        disabled={isLoading || status !== "completed" || !input.trim()}
                        className="absolute right-2 p-1.5 rounded-md bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/40 disabled:opacity-50 disabled:hover:bg-cyan-500/20 transition-colors"
                    >
                        <Send className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </motion.div>
    );
};

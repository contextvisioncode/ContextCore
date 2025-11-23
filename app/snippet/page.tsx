"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { FileCode, Send, Sparkles, AlertCircle, Loader2 } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

const EXAMPLE_CODE = `function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

console.log(fibonacci(10));`;

export default function SnippetPage() {
    const router = useRouter();
    const supabase = createClient();

    const [code, setCode] = useState("");
    const [language, setLanguage] = useState("auto");
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const languages = [
        { value: "auto", label: "Auto-detect" },
        { value: "javascript", label: "JavaScript" },
        { value: "typescript", label: "TypeScript" },
        { value: "python", label: "Python" },
        { value: "java", label: "Java" },
        { value: "cpp", label: "C++" },
        { value: "csharp", label: "C#" },
        { value: "go", label: "Go" },
        { value: "rust", label: "Rust" },
        { value: "php", label: "PHP" },
    ];

    // Check authentication on mount
    useEffect(() => {
        const checkAuth = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push("/login");
            }
        };
        checkAuth();
    }, [router, supabase]);

    const handleAnalyze = async () => {
        if (!code.trim()) {
            setError("Please paste some code first");
            return;
        }

        if (code.length > 50000) {
            setError("Code exceeds maximum length of 50,000 characters");
            return;
        }

        setIsAnalyzing(true);
        setError(null);

        try {
            const res = await fetch("http://localhost:3001/api/snippet/analyze", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ code, language }),
            });

            if (!res.ok) {
                throw new Error("Analysis failed");
            }

            const data = await res.json();

            // Redirect to dashboard with chat
            router.push(`/dashboard/project/${data.projectId}`);
        } catch (err) {
            console.error(err);
            setError("Failed to analyze code. Please try again.");
            setIsAnalyzing(false);
        }
    };

    const handleLoadExample = () => {
        setCode(EXAMPLE_CODE);
        setLanguage("javascript");
    };

    return (
        <div className="min-h-screen bg-[#030712] text-white">
            {/* Header */}
            <header className="border-b border-white/5 bg-[#030712]/80 backdrop-blur-xl">
                <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3 cursor-pointer" onClick={() => router.push("/")}>
                        <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
                            <FileCode className="w-5 h-5 text-white" />
                        </div>
                        <span className="font-bold text-lg">Code Chat</span>
                    </div>

                    <div className="text-xs font-mono text-gray-500">
                        <span className="text-purple-400">Instant</span> AI analysis • Chat with your code
                    </div>
                </div>
            </header>

            <div className="max-w-4xl mx-auto px-4 py-12">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                >
                    <div className="text-center space-y-4">
                        <div className="flex items-center justify-center gap-3">
                            <Sparkles className="w-10 h-10 text-purple-400" />
                            <h1 className="text-4xl font-bold">Paste & Chat with Your Code</h1>
                        </div>
                        <p className="text-gray-400 text-lg">
                            Paste any code snippet and start an intelligent conversation with AI about it
                        </p>
                    </div>

                    {/* Language Selector */}
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Programming Language</label>
                        <select
                            value={language}
                            onChange={(e) => setLanguage(e.target.value)}
                            className="w-full h-12 px-4 rounded-xl bg-black/40 border border-white/10 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none text-white"
                        >
                            {languages.map((lang) => (
                                <option key={lang.value} value={lang.value}>
                                    {lang.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Code Editor */}
                    <div className="relative">
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-sm font-medium text-gray-400">Your Code</label>
                            <button
                                onClick={handleLoadExample}
                                className="text-sm text-purple-400 hover:text-purple-300 transition-colors"
                            >
                                Load Example
                            </button>
                        </div>
                        <div className="relative">
                            <textarea
                                value={code}
                                onChange={(e) => setCode(e.target.value)}
                                placeholder="Paste your code here..."
                                rows={16}
                                className="w-full px-4 py-3 rounded-xl bg-black/60 backdrop-blur-xl border border-white/10 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none text-white font-mono text-sm resize-none"
                            />
                            <div className="absolute bottom-3 right-3 text-xs text-gray-500 font-mono">
                                {code.length} / 50,000 chars
                            </div>
                        </div>
                    </div>

                    {/* Error Display */}
                    <AnimatePresence>
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 flex items-start gap-3 text-red-400"
                            >
                                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                                <span>{error}</span>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Analyze Button */}
                    <button
                        onClick={handleAnalyze}
                        disabled={isAnalyzing || !code.trim()}
                        className="w-full h-16 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold text-xl transition-all flex items-center justify-center gap-3 shadow-2xl shadow-purple-600/40 hover:shadow-purple-600/60 hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden group"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                        {isAnalyzing ? (
                            <>
                                <Loader2 className="w-6 h-6 animate-spin" />
                                Generating AI Context...
                            </>
                        ) : (
                            <>
                                <Send className="w-6 h-6" />
                                Start Chat
                            </>
                        )}
                    </button>

                    <p className="text-center text-sm text-gray-500">
                        Your code will be analyzed and you'll be able to chat with AI about it
                    </p>
                </motion.div>
            </div>
        </div>
    );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Github, Upload, FileCode, ArrowLeft, Loader2, AlertCircle } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

type UploadMethod = "github" | "zip" | "code" | null;

export default function UploadPage() {
    const router = useRouter();
    const supabase = createClient();

    const [selectedMethod, setSelectedMethod] = useState<UploadMethod>(null);
    const [repoUrl, setRepoUrl] = useState("");
    const [codeSnippet, setCodeSnippet] = useState("");
    const [file, setFile] = useState<File | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            if (selectedFile.size > 100 * 1024 * 1024) { // 100MB limite
                setError("File size exceeds 100MB limit");
                return;
            }
            if (!selectedFile.name.endsWith('.zip')) {
                setError("Only .zip files are allowed");
                return;
            }
            setFile(selectedFile);
            setError(null);
        }
    };

    const handleSubmit = async () => {
        setIsLoading(true);
        setError(null);

        try {
            const projectId = crypto.randomUUID();

            if (selectedMethod === "github") {
                if (!repoUrl) {
                    setError("Please enter a GitHub URL");
                    setIsLoading(false);
                    return;
                }

                const res = await fetch("http://localhost:3001/api/ingest", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ projectId, repoUrl }),
                });

                if (res.ok) {
                    router.push(`/dashboard/project/${projectId}`);
                } else {
                    setError("Failed to analyze repository. Please check the URL.");
                }
            } else if (selectedMethod === "zip") {
                if (!file) {
                    setError("Please select a ZIP file");
                    setIsLoading(false);
                    return;
                }

                const formData = new FormData();
                formData.append("file", file);
                formData.append("projectId", projectId);

                const res = await fetch("http://localhost:3001/api/ingest/zip", {
                    method: "POST",
                    body: formData,
                });

                if (res.ok) {
                    router.push(`/dashboard/project/${projectId}`);
                } else {
                    setError("Failed to process ZIP file. Please try again.");
                }
            } else if (selectedMethod === "code") {
                if (!codeSnippet) {
                    setError("Please paste some code");
                    setIsLoading(false);
                    return;
                }

                const res = await fetch("http://localhost:3001/api/ingest/snippet", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ projectId, code: codeSnippet }),
                });

                if (res.ok) {
                    router.push(`/dashboard/project/${projectId}`);
                } else {
                    setError("Failed to analyze code snippet.");
                }
            }
        } catch (err) {
            console.error(err);
            setError("Error connecting to backend");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#030712] text-white flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-4xl space-y-8"
            >
                {/* Header */}
                <div className="text-center space-y-4">
                    <button
                        onClick={() => router.push("/")}
                        className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Home
                    </button>
                    <h1 className="text-4xl md:text-5xl font-bold">Choose Your Analysis Method</h1>
                    <p className="text-gray-400 text-lg">Select how you'd like to submit your project for analysis</p>
                </div>

                {/* Error Display */}
                {error && (
                    <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 flex items-start gap-3 text-red-400">
                        <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                        <span>{error}</span>
                    </div>
                )}

                {/* Method Selection */}
                {!selectedMethod && (
                    <div className="grid md:grid-cols-3 gap-6">
                        <MethodCard
                            icon={Github}
                            title="GitHub Repository"
                            description="Paste a GitHub URL or repo path"
                            onClick={() => setSelectedMethod("github")}
                            gradient="from-indigo-500/10 to-purple-500/10"
                            borderColor="border-indigo-500/30 hover:border-indigo-400/60"
                        />
                        <MethodCard
                            icon={Upload}
                            title="Upload ZIP"
                            description="Upload a .zip of your project"
                            onClick={() => setSelectedMethod("zip")}
                            gradient="from-cyan-500/10 to-blue-500/10"
                            borderColor="border-cyan-500/30 hover:border-cyan-400/60"
                        />
                        <MethodCard
                            icon={FileCode}
                            title="Paste Code"
                            description="Analyze a code snippet directly"
                            onClick={() => setSelectedMethod("code")}
                            gradient="from-purple-500/10 to-pink-500/10"
                            borderColor="border-purple-500/30 hover:border-purple-400/60"
                        />
                    </div>
                )}

                {/* GitHub Form */}
                {selectedMethod === "github" && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="p-8 rounded-3xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/30 space-y-6"
                    >
                        <div className="flex items-center justify-between">
                            <h2 className="text-2xl font-bold flex items-center gap-3">
                                <Github className="w-8 h-8" />
                                GitHub Repository
                            </h2>
                            <button
                                onClick={() => setSelectedMethod(null)}
                                className="text-gray-400 hover:text-white transition-colors"
                            >
                                Change Method
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">Repository URL or Path</label>
                                <input
                                    type="text"
                                    placeholder="facebook/react or https://github.com/vercel/next.js"
                                    value={repoUrl}
                                    onChange={(e) => setRepoUrl(e.target.value)}
                                    className="w-full h-14 px-4 rounded-xl bg-black/40 border border-white/10 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none text-white text-lg font-mono"
                                />
                            </div>

                            <button
                                onClick={handleSubmit}
                                disabled={isLoading || !repoUrl}
                                className="w-full h-14 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Analyzing...
                                    </>
                                ) : (
                                    "Analyze Repository"
                                )}
                            </button>
                        </div>
                    </motion.div>
                )}

                {/* ZIP Upload Form */}
                {selectedMethod === "zip" && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="p-8 rounded-3xl bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/30 space-y-6"
                    >
                        <div className="flex items-center justify-between">
                            <h2 className="text-2xl font-bold flex items-center gap-3">
                                <Upload className="w-8 h-8" />
                                Upload ZIP File
                            </h2>
                            <button
                                onClick={() => setSelectedMethod(null)}
                                className="text-gray-400 hover:text-white transition-colors"
                            >
                                Change Method
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div className="border-2 border-dashed border-white/20 rounded-xl p-8 text-center hover:border-cyan-500/50 transition-colors">
                                <Upload className="w-12 h-12 mx-auto mb-4 text-gray-500" />
                                <input
                                    type="file"
                                    accept=".zip"
                                    onChange={handleFileChange}
                                    className="hidden"
                                    id="zip-upload"
                                />
                                <label
                                    htmlFor="zip-upload"
                                    className="cursor-pointer text-white font-medium hover:text-cyan-400 transition-colors"
                                >
                                    {file ? file.name : "Click to select a ZIP file"}
                                </label>
                                <p className="text-sm text-gray-500 mt-2">Maximum file size: 100MB</p>
                            </div>

                            <button
                                onClick={handleSubmit}
                                disabled={isLoading || !file}
                                className="w-full h-14 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Uploading...
                                    </>
                                ) : (
                                    "Analyze ZIP"
                                )}
                            </button>
                        </div>
                    </motion.div>
                )}

                {/* Code Snippet Form */}
                {selectedMethod === "code" && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="p-8 rounded-3xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/30 space-y-6"
                    >
                        <div className="flex items-center justify-between">
                            <h2 className="text-2xl font-bold flex items-center gap-3">
                                <FileCode className="w-8 h-8" />
                                Paste Code Snippet
                            </h2>
                            <button
                                onClick={() => setSelectedMethod(null)}
                                className="text-gray-400 hover:text-white transition-colors"
                            >
                                Change Method
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">Your Code</label>
                                <textarea
                                    placeholder="Paste your code here..."
                                    value={codeSnippet}
                                    onChange={(e) => setCodeSnippet(e.target.value)}
                                    rows={12}
                                    className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none text-white font-mono text-sm resize-none"
                                />
                                <p className="text-sm text-gray-500 mt-2">Maximum: 10,000 lines</p>
                            </div>

                            <button
                                onClick={handleSubmit}
                                disabled={isLoading || !codeSnippet}
                                className="w-full h-14 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Analyzing...
                                    </>
                                ) : (
                                    "Analyze Code"
                                )}
                            </button>
                        </div>
                    </motion.div>
                )}
            </motion.div>
        </div>
    );
}

const MethodCard = ({ icon: Icon, title, description, onClick, gradient, borderColor }: any) => (
    <motion.button
        whileHover={{ scale: 1.02, y: -4 }}
        whileTap={{ scale: 0.98 }}
        onClick={onClick}
        className={`p-8 rounded-3xl bg-gradient-to-br ${gradient} border ${borderColor} transition-all duration-300 text-left group shadow-xl hover:shadow-2xl`}
    >
        <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <Icon className="w-7 h-7 text-white" />
        </div>
        <h3 className="text-xl font-bold mb-2">{title}</h3>
        <p className="text-gray-400 text-sm">{description}</p>
    </motion.button>
);

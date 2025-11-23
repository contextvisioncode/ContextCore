"use client";

import { useRef, useState } from "react";
import Editor, { Monaco } from "@monaco-editor/react";
import { Loader2, Copy, Check, Download, Maximize2, Minimize2 } from "lucide-react";
import * as monaco from "monaco-editor";

interface MonacoEditorProps {
    value: string;
    onChange: (value: string) => void;
    language: string;
    readOnly?: boolean;
    height?: string;
    theme?: "vs-dark" | "light" | "hc-black";
    minimap?: boolean;
    lineNumbers?: "on" | "off" | "relative";
    showActions?: boolean;
}

export default function MonacoEditor({
    value,
    onChange,
    language,
    readOnly = false,
    height = "500px",
    theme = "vs-dark",
    minimap = true,
    lineNumbers = "on",
    showActions = true,
}: MonacoEditorProps) {
    const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
    const [copied, setCopied] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);

    const handleEditorDidMount = (editor: monaco.editor.IStandaloneCodeEditor, monaco: Monaco) => {
        editorRef.current = editor;

        // Configure editor options
        editor.updateOptions({
            fontSize: 14,
            fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
            fontLigatures: true,
            lineHeight: 22,
            padding: { top: 16, bottom: 16 },
            scrollBeyondLastLine: false,
            smoothScrolling: true,
            cursorBlinking: "smooth",
            cursorSmoothCaretAnimation: "on",
            renderWhitespace: "selection",
            bracketPairColorization: { enabled: true },
            guides: {
                bracketPairs: true,
                indentation: true,
            },
        });

        // Add custom commands
        editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
            // Format on Ctrl+S
            editor.getAction("editor.action.formatDocument")?.run();
        });
    };

    const handleCopy = async () => {
        await navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleDownload = () => {
        const blob = new Blob([value], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `snippet.${getFileExtension(language)}`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleFormat = () => {
        editorRef.current?.getAction("editor.action.formatDocument")?.run();
    };

    const toggleFullscreen = () => {
        setIsFullscreen(!isFullscreen);
    };

    const getFileExtension = (lang: string): string => {
        const extensions: { [key: string]: string } = {
            javascript: "js",
            typescript: "ts",
            python: "py",
            java: "java",
            cpp: "cpp",
            csharp: "cs",
            go: "go",
            rust: "rs",
            php: "php",
            ruby: "rb",
            swift: "swift",
            kotlin: "kt",
            html: "html",
            css: "css",
            json: "json",
            yaml: "yaml",
            markdown: "md",
        };
        return extensions[lang] || "txt";
    };

    return (
        <div
            className={`relative ${isFullscreen
                    ? "fixed inset-0 z-50 bg-[#1e1e1e]"
                    : "rounded-xl overflow-hidden border border-white/10"
                }`}
        >
            {/* Action Bar */}
            {showActions && (
                <div className="flex items-center justify-between px-4 py-2 bg-[#1e1e1e] border-b border-white/5">
                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                            <div className="w-3 h-3 rounded-full bg-red-500/80" />
                            <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                            <div className="w-3 h-3 rounded-full bg-green-500/80" />
                        </div>
                        <span className="ml-3 text-xs font-mono text-gray-400">
                            {language || "plaintext"}
                        </span>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleFormat}
                            className="px-3 py-1 text-xs rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-all"
                            title="Format Code (Ctrl+S)"
                        >
                            Format
                        </button>
                        <button
                            onClick={handleCopy}
                            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-all"
                            title="Copy to Clipboard"
                        >
                            {copied ? (
                                <Check className="w-4 h-4 text-green-400" />
                            ) : (
                                <Copy className="w-4 h-4" />
                            )}
                        </button>
                        <button
                            onClick={handleDownload}
                            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-all"
                            title="Download File"
                        >
                            <Download className="w-4 h-4" />
                        </button>
                        <button
                            onClick={toggleFullscreen}
                            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-all"
                            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
                        >
                            {isFullscreen ? (
                                <Minimize2 className="w-4 h-4" />
                            ) : (
                                <Maximize2 className="w-4 h-4" />
                            )}
                        </button>
                    </div>
                </div>
            )}

            {/* Monaco Editor */}
            <Editor
                height={isFullscreen ? "calc(100vh - 48px)" : height}
                defaultLanguage={language}
                language={language}
                value={value}
                onChange={(value) => onChange(value || "")}
                theme={theme}
                onMount={handleEditorDidMount}
                loading={
                    <div className="flex items-center justify-center h-full bg-[#1e1e1e]">
                        <div className="flex flex-col items-center gap-3">
                            <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
                            <span className="text-sm text-gray-400">Loading editor...</span>
                        </div>
                    </div>
                }
                options={{
                    readOnly,
                    minimap: { enabled: minimap },
                    lineNumbers,
                    automaticLayout: true,
                    scrollbar: {
                        vertical: "auto",
                        horizontal: "auto",
                        useShadows: true,
                        verticalScrollbarSize: 10,
                        horizontalScrollbarSize: 10,
                    },
                }}
            />

            {/* Stats Bar */}
            <div className="flex items-center justify-between px-4 py-1.5 bg-[#1e1e1e] border-t border-white/5 text-xs text-gray-400 font-mono">
                <div className="flex items-center gap-4">
                    <span>Lines: {value.split("\n").length}</span>
                    <span>Chars: {value.length}</span>
                    <span>Words: {value.split(/\s+/).filter(Boolean).length}</span>
                </div>
                <div>
                    {readOnly && (
                        <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 text-xs">
                            Read-only
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}

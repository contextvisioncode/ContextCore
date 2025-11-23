"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, X, Target, SkipForward } from "lucide-react";

type Step = {
    targetId: string;
    title: string;
    content: string;
    position: "left" | "right" | "center" | "bottom";
};

const MISSION_STEPS: Step[] = [
    {
        targetId: "mission-welcome",
        title: "WELCOME, COMMANDER",
        content: "Welcome to ContextCore Mission Control. This system has analyzed your codebase and established a neural link. Let me guide you through your new capabilities.",
        position: "center"
    },
    {
        targetId: "mission-dna",
        title: "PROJECT DNA",
        content: "Here you'll find the vital statistics of your project. Complexity score, tech stack analysis, and overall system health are monitored in real-time.",
        position: "right"
    },
    {
        targetId: "mission-map-toggle",
        title: "ARCHITECTURE MAP",
        content: "Access the visual neural network of your code. Click this to enter the immersive 3D graph view where you can explore dependencies and data flow.",
        position: "right"
    },
    {
        targetId: "mission-briefing",
        title: "INTELLIGENCE BRIEFING",
        content: "Your AI analyst generates high-level summaries here. Use this to quickly understand what this project does without reading a single line of code.",
        position: "left"
    },
    {
        targetId: "mission-tactics",
        title: "TACTICAL OPERATIONS",
        content: "Execute specialized AI agents. 'Bug Hunter' finds errors, 'Security Audit' checks for flaws, and 'Refactor' suggests improvements. One click to deploy.",
        position: "left"
    },
    {
        targetId: "mission-chat",
        title: "NEURAL LINK",
        content: "This is your direct line to the system core. You can chat naturally with your codebase, ask questions, or request changes.",
        position: "left"
    },
    {
        targetId: "mission-chat-export",
        title: "EXPORT RULES (CRITICAL)",
        content: "This is the most powerful feature. Select your IDE (VS Code, Cursor, Windsurf) and click 'EXPORT RULES'. This generates a configuration file (.xml or .cursorrules) that you can drop into your project to give your local AI full context.",
        position: "left"
    },
    {
        targetId: "mission-chat-input",
        title: "COMMAND INPUT",
        content: "Type your instructions here. Use the 'Enhance' button to let our AI optimize your prompt for better results before sending.",
        position: "left"
    }
];

export function MissionGuide() {
    const [isVisible, setIsVisible] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [rect, setRect] = useState<DOMRect | null>(null);

    useEffect(() => {
        // Check if user has seen the guide
        const hasSeen = localStorage.getItem("contextcore_mission_complete");
        if (!hasSeen) {
            // Small delay to let animations finish
            setTimeout(() => setIsVisible(true), 1500);
        }
    }, []);

    useEffect(() => {
        if (!isVisible) return;

        const updateRect = () => {
            const step = MISSION_STEPS[currentStep];
            if (step.targetId === "mission-welcome") {
                setRect(null); // Center screen
                return;
            }

            const element = document.getElementById(step.targetId);
            if (element) {
                setRect(element.getBoundingClientRect());
            }
        };

        updateRect();
        window.addEventListener("resize", updateRect);
        return () => window.removeEventListener("resize", updateRect);
    }, [currentStep, isVisible]);

    const handleNext = () => {
        if (currentStep < MISSION_STEPS.length - 1) {
            setCurrentStep(prev => prev + 1);
        } else {
            completeMission();
        }
    };

    const completeMission = () => {
        setIsVisible(false);
        localStorage.setItem("contextcore_mission_complete", "true");
    };

    if (!isVisible) return null;

    const step = MISSION_STEPS[currentStep];

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] overflow-hidden pointer-events-none">
                {/* Transparent Backdrop with Spotlight */}
                {/* We use a massive box-shadow on the highlighted element to darken everything else */}
                {rect ? (
                    <div
                        style={{
                            top: rect.top - 10,
                            left: rect.left - 10,
                            width: rect.width + 20,
                            height: rect.height + 20,
                            boxShadow: "0 0 0 9999px rgba(15, 23, 42, 0.85)"
                        }}
                        className="absolute rounded-xl border-2 border-indigo-500/50 transition-all duration-500 ease-in-out animate-pulse pointer-events-none"
                    />
                ) : (
                    <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm transition-all duration-500" />
                )}

                {/* Content Box */}
                <motion.div
                    key={currentStep}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className={`absolute w-96 p-6 bg-black/90 border border-indigo-500/30 rounded-2xl shadow-2xl backdrop-blur-xl pointer-events-auto
                        ${step.position === 'center' ? 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2' : ''}
                        ${step.position === 'right' && rect ? `top-[${rect.top}px] left-[${rect.right + 40}px]` : ''}
                        ${step.position === 'left' && rect ? `top-[${rect.top}px] right-[${window.innerWidth - rect.left + 40}px]` : ''}
                    `}
                    style={
                        step.position !== 'center' && rect ? {
                            top: Math.max(20, Math.min(window.innerHeight - 300, rect.top)),
                            left: step.position === 'right' ? rect.right + 40 : undefined,
                            right: step.position === 'left' ? window.innerWidth - rect.left + 40 : undefined,
                        } : undefined
                    }
                >
                    <div className="flex items-center gap-2 mb-4 text-indigo-400 border-b border-indigo-500/20 pb-2">
                        <Target className="w-5 h-5" />
                        <span className="font-mono text-xs font-bold tracking-widest uppercase">MISSION BRIEFING {currentStep + 1}/{MISSION_STEPS.length}</span>
                    </div>

                    <h3 className="text-xl font-bold text-white mb-3">{step.title}</h3>
                    <p className="text-gray-300 leading-relaxed mb-6 font-light">
                        {step.content}
                    </p>

                    <div className="flex items-center justify-between">
                        <button
                            onClick={completeMission}
                            className="text-xs text-gray-500 hover:text-white flex items-center gap-1 transition-colors"
                        >
                            <SkipForward className="w-3 h-3" />
                            ABORT
                        </button>

                        <button
                            onClick={handleNext}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded-lg font-bold text-sm flex items-center gap-2 transition-all shadow-lg shadow-indigo-500/20"
                        >
                            {currentStep === MISSION_STEPS.length - 1 ? "ENGAGE SYSTEM" : "NEXT"}
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}

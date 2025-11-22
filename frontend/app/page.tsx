"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Github, Lock, Zap, ShieldCheck, Eye, Cpu, Activity, Server, Code2, ChevronRight, LogIn, UserPlus, Target, Radar, Brain, Sparkles, FileCode } from "lucide-react";
import { AuroraBackground } from "@/components/ui/AuroraBackground";
import { createClient } from "@/utils/supabase/client";
import { cn } from "@/lib/utils";

export default function HomePage() {
  const router = useRouter();
  const supabase = createClient();
  const [sessionId, setSessionId] = useState("INITIALIZING...");
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    setSessionId(crypto.randomUUID().slice(0, 8));

    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    checkUser();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    router.refresh();
  };

  const handleStartAnalysis = () => {
    if (!user) {
      router.push("/login");
    } else {
      router.push("/upload");
    }
  };

  return (
    <div className="min-h-screen bg-[#030712] text-white selection:bg-indigo-500/30">

      {/* Sticky Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#030712]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Eye className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg">ContextVision</span>

            {/* System Status Indicator */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-black/40 border text-xs font-mono">
              {user ? (
                <>
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                  </span>
                  <span className="text-green-400">SYSTEM ONLINE</span>
                </>
              ) : (
                <>
                  <span className="relative flex h-2 w-2">
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                  </span>
                  <span className="text-amber-400">STANDBY MODE</span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Snippet Mode Link */}
            <button
              onClick={() => router.push("/snippet")}
              className="hidden md:flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-600/10 hover:bg-purple-600/20 border border-purple-500/30 hover:border-purple-500/50 transition-all text-sm font-medium text-purple-300"
            >
              <FileCode className="w-4 h-4" />
              Snippet Mode
            </button>
            {user ? (
              <>
                <span className="text-sm text-gray-400 font-mono hidden lg:inline">{user.email}</span>
                <button
                  onClick={handleSignOut}
                  className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-all text-sm font-medium"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => router.push("/login")}
                  className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-all text-sm font-medium"
                >
                  <LogIn className="w-4 h-4 inline mr-2" />
                  Login
                </button>
                <button
                  onClick={() => router.push("/login")}
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-all text-sm font-bold shadow-lg shadow-indigo-600/20"
                >
                  <UserPlus className="w-4 h-4 inline mr-2" />
                  Get Started
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <AuroraBackground className="relative min-h-[90vh] flex flex-col items-center justify-center overflow-hidden pt-16">
        <div className="relative z-10 max-w-5xl w-full px-4 text-center space-y-8">

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-6"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-mono text-indigo-300">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
              </span>
              AI-POWERED CODE INTELLIGENCE
            </div>

            <h1 className="text-5xl md:text-7xl font-bold tracking-tighter leading-tight bg-clip-text text-transparent bg-gradient-to-b from-white via-indigo-100 to-indigo-900/50">
              See the Invisible.<br />Master Your Codebase.
            </h1>

            <p className="text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
              Transform any GitHub repository into an <span className="text-indigo-400 font-semibold">interactive neural map</span>. Detect vulnerabilities, visualize architecture, and deploy AI agents—all in seconds.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="flex flex-col gap-4 max-w-2xl mx-auto w-full"
          >
            <button
              onClick={handleStartAnalysis}
              className="h-20 px-12 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:via-purple-500 hover:to-pink-500 text-white font-bold text-2xl transition-all flex items-center justify-center gap-4 shadow-2xl shadow-indigo-600/40 hover:shadow-indigo-600/60 hover:-translate-y-2 relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
              <Zap className="w-8 h-8 fill-current" />
              <span className="tracking-wide">START ANALYSIS</span>
              <ChevronRight className="w-8 h-8" />
            </button>

            <div className="flex items-center justify-center gap-6 text-xs font-mono text-gray-500">
              <span className="flex items-center gap-1.5"><ShieldCheck className="w-3 h-3" /> Zero Retention</span>
              <span className="flex items-center gap-1.5"><Server className="w-3 h-3" /> Private</span>
              <span className="flex items-center gap-1.5"><Sparkles className="w-3 h-3" /> AI-Powered</span>
            </div>
          </motion.div>
        </div>
      </AuroraBackground>

      {/* Bento Grid Features */}
      <section className="py-24 relative z-10 bg-[#030712]">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">Mission Control for Your Code</h2>
            <p className="text-gray-400 max-w-2xl mx-auto text-lg">
              Deploy specialized AI agents and visualize your entire software architecture in real-time.
            </p>
          </div>

          {/* Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {/* Large Feature - Intelligence Briefing */}
            <motion.article
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="md:col-span-2 md:row-span-2 p-10 rounded-3xl bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-indigo-500/5 border border-indigo-500/30 hover:border-indigo-400/50 transition-all duration-300 group relative overflow-hidden shadow-xl hover:shadow-indigo-500/20"
            >
              <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/20 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2 group-hover:bg-indigo-400/30 transition-colors duration-500" />
              <div className="relative z-10">
                <div className="w-16 h-16 bg-indigo-500/20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-indigo-500/30 transition-all duration-300 shadow-lg">
                  <Brain className="w-8 h-8 text-indigo-400" />
                </div>
                <h3 className="text-3xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-white to-indigo-200">Intelligence Briefing</h3>
                <p className="text-gray-400 leading-relaxed mb-8 text-lg">
                  Get an instant AI-generated executive summary of your entire project. Understand architecture, tech stack, and critical insights in seconds—not hours.
                </p>
                <ul className="space-y-3 text-sm text-gray-300">
                  <li className="flex items-center gap-3"><Check /> Tech Stack Detection</li>
                  <li className="flex items-center gap-3"><Check /> Architecture Analysis</li>
                  <li className="flex items-center gap-3"><Check /> Complexity Metrics</li>
                </ul>
              </div>
            </motion.article>

            {/* Security Audit */}
            <BentoCard
              icon={ShieldCheck}
              title="Security Audit"
              desc="AI-powered vulnerability scanner detects threats before they become problems."
              gradient="from-red-500/10 to-orange-500/10"
              borderColor="border-red-500/20 hover:border-red-500/40"
            />

            {/* Architecture Map */}
            <BentoCard
              icon={Radar}
              title="Architecture Map"
              desc="Interactive neural graph reveals hidden dependencies and bottlenecks."
              gradient="from-cyan-500/10 to-blue-500/10"
              borderColor="border-cyan-500/20 hover:border-cyan-500/40"
            />

            {/* Tactical Ops */}
            <motion.article
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="md:col-span-2 p-8 rounded-3xl bg-gradient-to-br from-purple-500/10 via-pink-500/10 to-purple-500/5 border border-purple-500/30 hover:border-purple-400/50 transition-all duration-300 group shadow-xl hover:shadow-purple-500/20"
            >
              <div className="w-14 h-14 bg-purple-500/20 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 group-hover:bg-purple-500/30 transition-all duration-300 shadow-lg">
                <Target className="w-7 h-7 text-purple-400" />
              </div>
              <h3 className="text-2xl font-bold mb-3 bg-clip-text text-transparent bg-gradient-to-r from-white to-purple-200">Tactical Operations Grid</h3>
              <p className="text-gray-400 text-base leading-relaxed">
                Deploy specialized AI agents with a single click: Bug Hunter, Performance Analyzer, Code Reviewer.
              </p>
            </motion.article>
          </div>
        </div>
      </section>

      {/* Trust Signals */}
      <section className="py-16 relative z-10 border-y border-white/5 bg-gradient-to-b from-[#030712] to-indigo-950/10">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <StatCard label="Lines Analyzed" value="10M+" />
            <StatCard label="Vulnerabilities Found" value="2,847" />
            <StatCard label="Data Retention" value="0ms" />
            <StatCard label="Encryption" value="AES-256" />
          </div>
        </div>
      </section>

      {/* Privacy Section - Compact */}
      <section className="py-20 relative z-10 bg-[#030712]">
        <div className="max-w-5xl mx-auto px-4 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-xs font-mono text-green-400">
            <Lock className="w-3 h-3" /> BANK-GRADE SECURITY
          </div>
          <h2 className="text-4xl font-bold">Your Code Never Leaves Your Sight.</h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Zero-retention policy. Ephemeral containers. Enterprise-ready compliance. Your intellectual property stays yours.
          </p>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 text-center relative z-10 border-t border-white/5">
        <h2 className="text-3xl font-bold mb-6">Ready to Reveal the Invisible?</h2>
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="px-8 py-4 bg-white text-black font-bold rounded-full hover:bg-gray-200 transition-all inline-flex items-center gap-2 shadow-xl hover:-translate-y-1"
        >
          Start Free Analysis <ChevronRight className="w-5 h-5" />
        </button>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-white/5 text-center text-gray-600 text-sm relative z-10">
        <p>© 2025 ContextVisionCode. All systems operational.</p>
      </footer>
    </div>
  );
}

const BentoCard = ({ icon: Icon, title, desc, gradient, borderColor }: any) => (
  <motion.article
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ delay: 0.1 }}
    className={cn(
      "p-6 rounded-2xl bg-gradient-to-br border transition-all group",
      gradient,
      borderColor
    )}
  >
    <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
      <Icon className="w-6 h-6 text-white" />
    </div>
    <h3 className="text-lg font-bold mb-2">{title}</h3>
    <p className="text-gray-400 text-sm leading-relaxed">{desc}</p>
  </motion.article>
);

const StatCard = ({ label, value }: { label: string; value: string }) => (
  <div className="space-y-2">
    <div className="text-3xl md:text-4xl font-bold text-indigo-400">{value}</div>
    <div className="text-sm text-gray-500 uppercase tracking-wider">{label}</div>
  </div>
);

const Check = () => (
  <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

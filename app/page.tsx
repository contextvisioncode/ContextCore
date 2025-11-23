"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Github, Lock, Zap, ShieldCheck, Eye, Cpu, Activity, Server, Code2, ChevronRight, LogIn, UserPlus, Target, Radar, Brain, Sparkles, FileCode, FileText, X } from "lucide-react";
import { AuroraBackground } from "@/components/ui/AuroraBackground";
import { createClient } from "@/utils/supabase/client";
import { cn } from "@/lib/utils";

export default function HomePage() {
  const router = useRouter();
  const supabase = createClient();
  const [sessionId, setSessionId] = useState("INITIALIZING...");
  const [user, setUser] = useState<any>(null);
  const [showWhitePaper, setShowWhitePaper] = useState(false);

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

  const handleSnippetMode = () => {
    if (!user) {
      router.push("/login");
    } else {
      router.push("/snippet");
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
            <span className="font-bold text-lg">ContextCode</span>

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
              onClick={handleSnippetMode}
              className="hidden md:flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-600/10 hover:bg-purple-600/20 border border-purple-500/30 hover:border-purple-500/50 transition-all text-sm font-medium text-purple-300"
            >
              <FileCode className="w-4 h-4" />
              Snippet Mode
            </button>

            {/* White Paper Button */}
            <button
              onClick={() => setShowWhitePaper(true)}
              className="hidden md:flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600/10 hover:bg-indigo-600/20 border border-indigo-500/30 hover:border-indigo-500/50 transition-all text-sm font-medium text-indigo-300"
            >
              <FileText className="w-4 h-4" />
              White Paper
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

      {/* Compact Hero - No Massive Whitespace */}
      <section className="relative min-h-[60vh] flex flex-col items-center justify-center overflow-hidden pt-20 pb-12 px-4 bg-gradient-to-b from-[#030712] via-indigo-950/20 to-[#030712]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/20 via-[#030712] to-[#030712]" />

        <div className="relative z-10 max-w-6xl w-full text-center space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-4"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-mono text-indigo-300">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
              </span>
              2M TOKEN CONTEXT WINDOW • ZERO DATA RETENTION
            </div>

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tight leading-[1.1] bg-clip-text text-transparent bg-gradient-to-b from-white via-indigo-100 to-indigo-300">
              Turn Any GitHub Repo Into a<br />Neural Map in 10 Seconds
            </h1>

            <p className="text-lg md:text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed font-medium">
              AI reads your <span className="text-indigo-400 font-bold">entire codebase</span> like a senior engineer. Get line-number citations, auto-generated architecture graphs, and instant vulnerability scans. <span className="text-green-400 font-bold">Your IP never touches our servers.</span>
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.15, duration: 0.4 }}
            className="flex flex-col sm:flex-row gap-3 max-w-2xl mx-auto justify-center"
          >
            <button
              onClick={handleStartAnalysis}
              className="h-14 px-8 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:via-purple-500 hover:to-pink-500 text-white font-bold text-lg transition-all flex items-center justify-center gap-3 shadow-2xl shadow-indigo-600/50 hover:shadow-indigo-600/70 hover:-translate-y-1 relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
              <Zap className="w-5 h-5 fill-current" />
              <span className="tracking-wide">Upload Repository</span>
            </button>

            <button
              onClick={handleSnippetMode}
              className="h-14 px-8 rounded-xl bg-white/5 hover:bg-white/10 border border-white/20 hover:border-white/30 text-white font-bold text-lg transition-all flex items-center justify-center gap-3 shadow-xl"
            >
              <FileCode className="w-5 h-5" />
              <span>Paste Snippet</span>
            </button>
          </motion.div>
        </div>
      </section>

      {/* Universal Ecosystem Compatibility Strip */}
      <section className="py-8 relative z-10 bg-[#030712] border-b border-white/5">
        <div className="max-w-6xl mx-auto px-4 text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-mono text-gray-400">
            <Sparkles className="w-3 h-3 text-indigo-400" />
            UNIVERSAL COMPATIBILITY
          </div>

          <h3 className="text-xl md:text-2xl font-bold text-white">
            Write Once, Deploy Everywhere.
          </h3>
          <p className="text-sm text-gray-400 max-w-xl mx-auto">
            Your optimized prompts work natively inside your favorite environments.
          </p>

          {/* Icon Grid */}
          <div className="flex flex-wrap items-center justify-center gap-6 pt-4">
            {[
              { name: "GitHub", icon: "github" },
              { name: "Google AI Studio", icon: "google" },
              { name: "VS Code", icon: "visualstudiocode" },
              { name: "Cursor", icon: "cursor" },
              { name: "Windsurf", icon: "codeium" },
              { name: "Replit", icon: "replit" },
              { name: "Bolt.new", icon: "stackblitz" },
              { name: "Lovable", icon: "v0" },
              { name: "Claude", icon: "anthropic" }
            ].map((platform, i) => (
              <motion.div
                key={platform.name}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05, duration: 0.3 }}
                className="group relative"
              >
                {/* Tooltip */}
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 px-3 py-1 rounded-lg bg-black/90 border border-white/20 text-xs font-semibold text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                  Optimized for {platform.name}
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-black/90 border-r border-b border-white/20 rotate-45" />
                </div>

                {/* Icon Container */}
                <div className="w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-white/10 group-hover:border-white/30 transition-all duration-300 group-hover:scale-110 group-hover:shadow-xl group-hover:shadow-indigo-500/30">
                  <img
                    src={`https://cdn.simpleicons.org/${platform.icon}`}
                    alt={platform.name}
                    className="w-7 h-7 opacity-80 group-hover:opacity-100 transition-all duration-300 drop-shadow-lg"
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Bento Grid - Maximum Information Density */}
      <section className="py-12 relative z-10 bg-[#030712] px-4">
        <div className="max-w-7xl mx-auto">

          {/* Grid Layout */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">

            {/* Feature 1: XML Context Engine */}
            <motion.article
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="md:col-span-4 p-6 rounded-2xl bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent border border-indigo-500/20 hover:border-indigo-400/40 transition-all group relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/10 blur-[80px] rounded-full" />
              <div className="relative z-10 space-y-3">
                <div className="w-12 h-12 bg-indigo-500/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Code2 className="w-6 h-6 text-indigo-400" />
                </div>
                <h3 className="text-xl font-bold text-white">Upload Once. Understand Forever.</h3>
                <p className="text-sm text-gray-400 leading-relaxed">
                  AI reads your entire codebase and packs it into a structured XML context. Every file. Every line. Zero information loss.
                </p>
                <div className="pt-2 flex items-center gap-2 text-xs font-mono text-indigo-300">
                  <Activity className="w-3 h-3" />
                  <span>XML Context Engine</span>
                </div>
              </div>
            </motion.article>

            {/* Feature 2: 2M Token Memory */}
            <motion.article
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="md:col-span-4 p-6 rounded-2xl bg-gradient-to-br from-cyan-500/10 via-blue-500/5 to-transparent border border-cyan-500/20 hover:border-cyan-400/40 transition-all group"
            >
              <div className="space-y-3">
                <div className="w-12 h-12 bg-cyan-500/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Brain className="w-6 h-6 text-cyan-400" />
                </div>
                <h3 className="text-xl font-bold text-white">AI That Never Forgets</h3>
                <p className="text-sm text-gray-400 leading-relaxed">
                  2 million token context window powered by Gemini 2.5 Flash. No "lost in the middle" phenomenon.
                </p>
                <div className="pt-4">
                  <div className="flex justify-between text-xs font-mono text-cyan-300 mb-1">
                    <span>MEMORY CAPACITY</span>
                    <span>2,000,000 tokens</span>
                  </div>
                  <div className="h-2 bg-black/40 rounded-full overflow-hidden border border-cyan-500/20">
                    <motion.div
                      className="h-full bg-gradient-to-r from-cyan-500 to-blue-500"
                      initial={{ width: "0%" }}
                      whileInView={{ width: "100%" }}
                      viewport={{ once: true }}
                      transition={{ duration: 2, delay: 0.5 }}
                    />
                  </div>
                </div>
              </div>
            </motion.article>

            {/* Feature 3: Neural Graph */}
            <motion.article
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="md:col-span-4 p-6 rounded-2xl bg-gradient-to-br from-purple-500/10 via-pink-500/5 to-transparent border border-purple-500/20 hover:border-purple-400/40 transition-all group"
            >
              <div className="space-y-3">
                <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Radar className="w-6 h-6 text-purple-400" />
                </div>
                <h3 className="text-xl font-bold text-white">See the Invisible Architecture</h3>
                <p className="text-sm text-gray-400 leading-relaxed">
                  Auto-generated dependency graphs reveal hidden connections. Click any node for instant explanations.
                </p>
                <div className="pt-2 grid grid-cols-3 gap-1">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="h-8 bg-purple-500/10 rounded border border-purple-500/20 flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-purple-400/50" />
                    </div>
                  ))}
                </div>
              </div>
            </motion.article>

            {/* Feature 4: Snippet Mode (Wide Card) */}
            <motion.article
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="md:col-span-8 p-6 rounded-2xl bg-gradient-to-br from-green-500/10 via-emerald-500/5 to-transparent border border-green-500/20 hover:border-green-400/40 transition-all group relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-96 h-96 bg-green-500/10 blur-[100px] rounded-full" />
              <div className="relative z-10 flex flex-col md:flex-row gap-6">
                <div className="flex-1 space-y-3">
                  <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <FileCode className="w-6 h-6 text-green-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-white">Paste Code. Get Expert Review. No Repo Required.</h3>
                  <p className="text-sm text-gray-400 leading-relaxed">
                    Snippet Mode analyzes any code fragment instantly. AI generates deep context, architecture insights, and security assessments—even from a single function.
                  </p>
                  <button
                    onClick={handleSnippetMode}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600/20 hover:bg-green-600/30 border border-green-500/30 text-green-300 font-semibold text-sm transition-all"
                  >
                    Try Snippet Mode <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
                <div className="md:w-64 p-3 rounded-xl bg-black/40 border border-white/10 font-mono text-xs">
                  <div className="text-green-400 mb-2">// Paste any code here</div>
                  <div className="text-gray-500">function analyze() {"{"}</div>
                  <div className="text-gray-500 pl-4">return ai.deepScan();</div>
                  <div className="text-gray-500">{"}"}</div>
                  <div className="mt-2 text-indigo-400">→ Instant AI Analysis</div>
                </div>
              </div>
            </motion.article>

            {/* Feature 5: Zero-Retention Security */}
            <motion.article
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
              className="md:col-span-4 p-6 rounded-2xl bg-gradient-to-br from-red-500/10 via-orange-500/5 to-transparent border border-red-500/20 hover:border-red-400/40 transition-all group"
            >
              <div className="space-y-3">
                <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Lock className="w-6 h-6 text-red-400" />
                </div>
                <h3 className="text-xl font-bold text-white">Your IP Never Touches Our Servers</h3>
                <p className="text-sm text-gray-400 leading-relaxed">
                  Zero-retention policy. Ephemeral containers. Bank-grade AES-256 encryption. Your code stays yours.
                </p>
                <div className="flex items-center gap-2 pt-2">
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-green-500/10 border border-green-500/20 text-xs font-mono text-green-400">
                    <ShieldCheck className="w-3 h-3" />
                    <span>VERIFIED</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-red-500/10 border border-red-500/20 text-xs font-mono text-red-400">
                    <Server className="w-3 h-3" />
                    <span>0ms RETENTION</span>
                  </div>
                </div>
              </div>
            </motion.article>

            {/* Feature 6: Tactical AI Agents */}
            <motion.article
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.5 }}
              className="md:col-span-8 p-6 rounded-2xl bg-gradient-to-br from-yellow-500/10 via-orange-500/5 to-transparent border border-yellow-500/20 hover:border-yellow-400/40 transition-all group"
            >
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-yellow-500/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Target className="w-6 h-6 text-yellow-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-white mb-2">Deploy Specialized AI Agents. One Click. 10x Faster Reviews.</h3>
                    <p className="text-sm text-gray-400 leading-relaxed">
                      Tactical Operations Grid deploys specialized AI agents: Bug Hunter, Performance Analyzer, Security Auditor, Code Reviewer.
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {[
                    { icon: ShieldCheck, label: "Security Audit", color: "red" },
                    { icon: Activity, label: "Performance", color: "cyan" },
                    { icon: Cpu, label: "Code Review", color: "purple" },
                    { icon: Zap, label: "Bug Hunter", color: "yellow" }
                  ].map((agent, i) => (
                    <div key={i} className={`p-3 rounded-lg bg-${agent.color}-500/10 border border-${agent.color}-500/20 hover:border-${agent.color}-500/40 transition-all cursor-pointer`}>
                      <agent.icon className={`w-5 h-5 text-${agent.color}-400 mb-1`} />
                      <div className="text-xs font-semibold text-white">{agent.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.article>

          </div>
        </div>
      </section>

      {/* Stats Bar - Compact Social Proof */}
      <section className="py-8 relative z-10 border-y border-white/5 bg-gradient-to-r from-[#030712] via-indigo-950/10 to-[#030712]">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <StatCard label="Lines Analyzed" value="10M+" />
            <StatCard label="Vulnerabilities Found" value="2,847" />
            <StatCard label="Data Retention" value="0ms" />
            <StatCard label="Encryption" value="AES-256" />
          </div>
        </div>
      </section>

      {/* Final CTA - Compact */}
      <section className="py-16 text-center relative z-10 bg-[#030712] border-t border-white/5">
        <div className="max-w-2xl mx-auto px-4 space-y-4">
          <h2 className="text-3xl md:text-4xl font-bold">Ready to See the Invisible?</h2>
          <p className="text-gray-400">Join developers analyzing 10M+ lines of code daily.</p>
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="px-8 py-4 bg-white text-black font-bold rounded-full hover:bg-gray-200 transition-all inline-flex items-center gap-2 shadow-xl hover:-translate-y-1"
          >
            Start Free Analysis <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-white/5 text-center text-gray-600 text-sm relative z-10">
        <p>© 2025 ContextCode. All systems operational.</p>
      </footer>

      {/* White Paper Modal */}
      <AnimatePresence>
        {showWhitePaper && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
            onClick={() => setShowWhitePaper(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="relative max-w-6xl w-full max-h-[90vh] bg-[#030712] border border-white/10 rounded-2xl overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                onClick={() => setShowWhitePaper(false)}
                className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-black/60 hover:bg-black/80 border border-white/20 flex items-center justify-center transition-all hover:scale-110"
              >
                <X className="w-5 h-5 text-white" />
              </button>

              {/* White Paper Image */}
              <div className="overflow-auto max-h-[90vh]">
                <img
                  src="https://files.catbox.moe/mijjte.png"
                  alt="ContextCode White Paper"
                  className="w-full h-auto"
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
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

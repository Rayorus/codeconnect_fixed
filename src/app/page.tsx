"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.4, ease: [0.25, 0.1, 0.25, 1] as const },
  }),
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};

const typingTexts = [
  "track your LeetCode progress",
  "chat with fellow coders",
  "get AI-powered mentoring",
  "share doubts & solutions",
  "grow your dev network",
];

export default function LandingPage() {
  const [typingIndex, setTypingIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const current = typingTexts[typingIndex];
    const timeout = setTimeout(
      () => {
        if (!isDeleting) {
          setDisplayedText(current.slice(0, displayedText.length + 1));
          if (displayedText.length === current.length) {
            setTimeout(() => setIsDeleting(true), 2000);
          }
        } else {
          setDisplayedText(current.slice(0, displayedText.length - 1));
          if (displayedText.length === 0) {
            setIsDeleting(false);
            setTypingIndex((prev) => (prev + 1) % typingTexts.length);
          }
        }
      },
      isDeleting ? 30 : 60
    );
    return () => clearTimeout(timeout);
  }, [displayedText, isDeleting, typingIndex]);

  return (
    <main className="min-h-screen flex flex-col w-full">
      {/* NAV */}
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4 }}
        className={`fixed top-0 left-0 right-0 z-50 px-6 py-4 flex items-center justify-between transition-all duration-300 ${
          scrolled ? "glass border-b border-cc-border shadow-lg" : "bg-transparent"
        }`}
      >
        <div className="flex items-center gap-2.5">
          <span className="text-cc-accent font-mono font-bold text-xl">&lt;CC/&gt;</span>
          <span className="text-cc-text font-semibold text-lg tracking-tight">CodeConnect</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/auth/login" className="text-cc-muted hover:text-cc-text text-sm transition-colors px-4 py-2 rounded-xl hover:bg-white/5">
            Sign in
          </Link>
          <Link href="/auth/signup" className="btn-primary text-sm !px-5 !py-2">
            Get Started
          </Link>
        </div>
      </motion.nav>

      {/* HERO */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-4 pt-32 pb-20 w-full relative">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="inline-flex items-center gap-2.5 glass rounded-full px-5 py-2 mb-10 text-sm"
        >
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cc-easy opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cc-easy" />
          </span>
          <span className="text-cc-text-secondary">Now in beta — join the community</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-5xl md:text-7xl lg:text-8xl font-extrabold text-cc-text mb-6 leading-[1.05] tracking-tight"
        >
          LeetCode,{" "}
          <span className="gradient-text">but social.</span>
        </motion.h1>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="text-cc-muted text-lg md:text-xl max-w-2xl mb-4 leading-relaxed"
        >
          Connect your LeetCode account and{" "}
          <span className="text-cc-accent-light font-medium">{displayedText}</span>
          <span className="animate-pulse text-cc-accent">|</span>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="text-cc-muted/60 text-sm mb-10"
        >
          All in one beautifully crafted platform.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.35 }}
          className="flex gap-4 flex-wrap justify-center"
        >
          <Link href="/auth/signup" className="btn-primary text-base !px-8 !py-3.5 group">
            <span className="flex items-center gap-2">
              Start for free
              <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </span>
          </Link>
          <Link href="/auth/login" className="btn-secondary text-base !px-8 !py-3.5">
            Sign in
          </Link>
        </motion.div>

        {/* Dashboard mockup */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="mt-20 w-full max-w-4xl mx-auto"
        >
          <div className="relative">
            <div className="absolute -inset-3 bg-cc-accent/5 rounded-3xl blur-2xl" />
            <div className="relative glass rounded-2xl border border-cc-border-glow overflow-hidden">
              <div className="flex items-center gap-2 px-5 py-3 border-b border-cc-border bg-cc-bg/50">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400/60" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400/60" />
                  <div className="w-3 h-3 rounded-full bg-green-400/60" />
                </div>
                <span className="text-xs text-cc-muted font-mono ml-3">codeconnect — dashboard</span>
              </div>
              <div className="p-6 grid grid-cols-4 gap-4">
                {[
                  { label: "Problems Solved", value: "847", color: "text-cc-easy" },
                  { label: "Friends", value: "24", color: "text-cc-accent-light" },
                  { label: "Posts", value: "156", color: "text-cc-medium" },
                  { label: "Acceptance", value: "76%", color: "text-cc-link" },
                ].map((stat) => (
                  <div key={stat.label} className="glass-card !p-4 text-center">
                    <div className={`text-2xl font-bold font-mono ${stat.color}`}>{stat.value}</div>
                    <div className="text-xs text-cc-muted mt-1">{stat.label}</div>
                  </div>
                ))}
              </div>
              <div className="px-6 pb-6 grid grid-cols-2 gap-4">
                <div className="glass-card !p-4 space-y-3">
                  <div className="text-sm font-medium text-cc-text">LeetCode Progress</div>
                  {[
                    { label: "Easy", pct: 78, color: "bg-cc-easy" },
                    { label: "Medium", pct: 52, color: "bg-cc-medium" },
                    { label: "Hard", pct: 23, color: "bg-cc-hard" },
                  ].map((bar) => (
                    <div key={bar.label}>
                      <div className="flex justify-between text-xs text-cc-muted mb-1">
                        <span>{bar.label}</span><span>{bar.pct}%</span>
                      </div>
                      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${bar.pct}%` }}
                          transition={{ duration: 0.8, delay: 0.8 }}
                          className={`h-full rounded-full ${bar.color}`}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="glass-card !p-4 space-y-2">
                  <div className="text-sm font-medium text-cc-text">Recent Activity</div>
                  {["Solved Two Sum in 3m", "Posted: BFS vs DFS help", "New friend: @coder42"].map((item, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-cc-muted py-1.5 border-b border-cc-border/30 last:border-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-cc-accent" />
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* FEATURES */}
      <section className="px-6 py-24 relative">
        <div className="divider-gradient mb-24" />
        <div className="max-w-5xl mx-auto">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} variants={staggerContainer} className="text-center mb-16">
            <motion.p variants={fadeInUp} custom={0} className="text-cc-accent text-sm font-mono tracking-wider mb-3 uppercase">Features</motion.p>
            <motion.h2 variants={fadeInUp} custom={1} className="text-3xl md:text-5xl font-bold text-cc-text mb-4">
              Everything you need to <span className="gradient-text-accent">level up</span>
            </motion.h2>
            <motion.p variants={fadeInUp} custom={2} className="text-cc-muted max-w-xl mx-auto">
              Built for developers who want to grow together. Track, connect, and collaborate — all in one place.
            </motion.p>
          </motion.div>

          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} variants={staggerContainer} className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              { icon: "📊", title: "Track Progress", desc: "Auto-sync your LeetCode stats — easy, medium, hard counts refresh automatically.", glow: "group-hover:shadow-[0_0_20px_rgba(52,211,153,0.1)]" },
              { icon: "🔒", title: "Encrypted Chat", desc: "Private real-time messaging with end-to-end encryption. Only friends can message.", glow: "group-hover:shadow-[0_0_20px_rgba(249,115,22,0.1)]" },
              { icon: "❓", title: "Post Doubts", desc: "Share problems you're stuck on. Get help from the community with tagged posts.", glow: "group-hover:shadow-[0_0_20px_rgba(234,88,12,0.1)]" },
              { icon: "✨", title: "AI Mentor", desc: "Get instant help from AI for coding problems, explanations, and interview prep.", glow: "group-hover:shadow-[0_0_20px_rgba(251,191,36,0.1)]" },
              { icon: "💻", title: "Code Compiler", desc: "Write, compile, and test code in Python, C, C++, and Java right in the browser.", glow: "group-hover:shadow-[0_0_20px_rgba(249,115,22,0.1)]" },
              { icon: "📰", title: "Tech News", desc: "Stay updated with the latest from Hacker News — curated top stories for devs.", glow: "group-hover:shadow-[0_0_20px_rgba(248,113,113,0.1)]" },
            ].map((f, i) => (
              <motion.div key={f.title} variants={fadeInUp} custom={i} className={`group glass-card !p-6 transition-all duration-200 ${f.glow}`}>
                <div className="text-3xl mb-4">{f.icon}</div>
                <h3 className="text-cc-text font-semibold text-lg mb-2">{f.title}</h3>
                <p className="text-cc-muted text-sm leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* WORKFLOW */}
      <section className="px-6 py-24 relative">
        <div className="divider-gradient mb-24" />
        <div className="max-w-4xl mx-auto">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} variants={staggerContainer} className="text-center mb-16">
            <motion.p variants={fadeInUp} custom={0} className="text-cc-medium text-sm font-mono tracking-wider mb-3 uppercase">How it works</motion.p>
            <motion.h2 variants={fadeInUp} custom={1} className="text-3xl md:text-5xl font-bold text-cc-text mb-4">
              Get started in <span className="gradient-text">minutes</span>
            </motion.h2>
          </motion.div>

          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} variants={staggerContainer} className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
            <div className="hidden md:block absolute top-12 left-[12.5%] right-[12.5%] h-[2px] bg-gradient-to-r from-cc-accent/20 via-cc-medium/15 to-cc-accent/20" />
            {[
              { step: "01", title: "Sign Up", desc: "Create your free account", color: "from-cc-accent to-cc-violet" },
              { step: "02", title: "Link LeetCode", desc: "Connect your username", color: "from-cc-medium to-cc-accent" },
              { step: "03", title: "Find Friends", desc: "Connect with devs", color: "from-cc-accent to-cc-medium" },
              { step: "04", title: "Level Up", desc: "Learn & grow together", color: "from-cc-easy to-cc-accent" },
            ].map((item, i) => (
              <motion.div key={item.step} variants={fadeInUp} custom={i} className="text-center relative">
                <div className={`w-12 h-12 mx-auto mb-4 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center text-white font-bold font-mono text-sm shadow-glow-sm`}>
                  {item.step}
                </div>
                <h4 className="text-cc-text font-semibold mb-1">{item.title}</h4>
                <p className="text-cc-muted text-sm">{item.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-24 relative">
        <div className="divider-gradient mb-24" />
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }} className="max-w-3xl mx-auto text-center relative">
          <div className="relative glass rounded-3xl p-12 md:p-16 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-cc-accent/5 to-transparent" />
            <div className="relative z-10">
              <h2 className="text-3xl md:text-5xl font-bold text-cc-text mb-4">
                Ready to <span className="gradient-text">connect?</span>
              </h2>
              <p className="text-cc-muted text-lg mb-8 max-w-md mx-auto">
                Join thousands of developers leveling up their coding skills together.
              </p>
              <Link href="/auth/signup" className="btn-primary text-base !px-10 !py-4 inline-flex items-center gap-2 group">
                Get Started — It&apos;s Free
                <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            </div>
          </div>
        </motion.div>
      </section>

      {/* FOOTER */}
      <footer className="px-6 py-8 relative">
        <div className="divider-gradient mb-8" />
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-mono text-cc-accent text-sm">&lt;CC/&gt;</span>
            <span className="text-cc-muted text-sm">CodeConnect — Built for the coding community</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-cc-muted">
            <Link href="/auth/login" className="hover:text-cc-text transition-colors">Sign in</Link>
            <Link href="/auth/signup" className="hover:text-cc-text transition-colors">Sign up</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}

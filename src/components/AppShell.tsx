"use client";
import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { Menu } from "lucide-react";
import Sidebar from "./Sidebar";
import PageTransition from "./PageTransition";

export default function AppShell({ username, children }: { username: string; children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-[100dvh] overflow-hidden w-full relative">
      {/* Mobile hamburger */}
      <button
        className="fixed top-3 left-3 z-50 md:hidden p-2.5 rounded-xl glass border border-cc-border tap-scale"
        aria-label="Open sidebar"
        onClick={() => setSidebarOpen(true)}
      >
        <Menu size={18} className="text-cc-text" />
      </button>

      <Sidebar
        username={username}
        mobileOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <main className="flex-1 w-full md:ml-60 overflow-y-auto flex flex-col bg-transparent">
        <AnimatePresence mode="wait">
          <PageTransition>
            {children}
          </PageTransition>
        </AnimatePresence>
      </main>
    </div>
  );
}

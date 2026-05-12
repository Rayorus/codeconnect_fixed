"use client";
import { useState } from "react";
import Sidebar from "./Sidebar";

export default function AppShell({ username, children }: { username: string; children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden w-full relative">
      {/* Hamburger for mobile */}
      <button
        className="absolute top-4 left-4 z-40 md:hidden p-2 rounded-lg bg-lc-surface border border-lc-border"
        aria-label="Open sidebar"
        onClick={() => setSidebarOpen(true)}
      >
        <span className="block w-6 h-0.5 bg-lc-text mb-1" />
        <span className="block w-6 h-0.5 bg-lc-text mb-1" />
        <span className="block w-6 h-0.5 bg-lc-text" />
      </button>
      {/* Sidebar: hidden on mobile, drawer when open */}
      <Sidebar
        username={username}
        mobileOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <main className="flex-1 w-full md:ml-56 overflow-y-auto bg-lc-bg px-4">
        {children}
      </main>
    </div>
  );
}

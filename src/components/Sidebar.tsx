"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useState } from "react";
import {
  LayoutDashboard, Users, MessageSquare, TrendingUp,
  User, LogOut, BarChart3, Rss, X, Sparkles, Code2
} from "lucide-react";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/feed", icon: Rss, label: "Feed" },
  { href: "/news", icon: BarChart3, label: "News" },
  { href: "/progress", icon: TrendingUp, label: "Progress" },
  { href: "/friends", icon: Users, label: "Friends" },
  { href: "/chat", icon: MessageSquare, label: "Messages" },
  { href: "/ai", icon: Sparkles, label: "AI Mentor" },
  { href: "/profile", icon: User, label: "Profile" },
  { href: "/compiler", icon: Code2, label: "Compiler" },
];

export default function Sidebar({ username, mobileOpen = false, onClose }: { username: string; mobileOpen?: boolean; onClose?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <>
      {/* Mobile overlay backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 md:hidden"
          onClick={onClose}
          style={{ animation: "fadeIn 0.15s ease" }}
        />
      )}

      <aside
        className={cn(
          "fixed left-0 top-0 h-[100dvh] w-60 flex flex-col z-40",
          "glass border-r border-cc-border",
          "transition-transform duration-200",
          mobileOpen
            ? "translate-x-0 animate-slide-in"
            : "-translate-x-full md:translate-x-0",
          !mobileOpen && "hidden md:flex"
        )}
      >
        {/* Mobile close */}
        {mobileOpen && (
          <button
            className="absolute top-3 right-3 z-50 p-2 rounded-xl hover:bg-cc-hover transition-colors md:hidden tap-scale-sm"
            aria-label="Close sidebar"
            onClick={onClose}
          >
            <X size={16} className="text-cc-muted" />
          </button>
        )}

        {/* Logo */}
        <div className="px-4 py-5 border-b border-cc-border">
          <Link href="/dashboard" className="flex items-center gap-2.5 group tap-scale-sm">
            <span className="text-cc-accent font-mono font-bold text-lg">&lt;CC/&gt;</span>
            <span className="text-cc-text font-semibold tracking-tight">CodeConnect</span>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2.5 py-4 space-y-0.5 overflow-y-auto">
          {navItems.map(({ href, icon: Icon, label }) => {
            const isActive = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                className={cn("sidebar-nav-item relative overflow-hidden", isActive ? "active" : "")}
                onClick={onClose}
              >
                {isActive && (
                  <motion.div
                    layoutId="sidebarActiveTab"
                    className="absolute inset-0 bg-cc-accent/8 rounded-xl"
                    transition={{ type: "spring", stiffness: 350, damping: 30 }}
                  />
                )}
                <Icon size={16} className="relative z-10" />
                <span className="relative z-10">{label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User footer */}
        <div className="px-2.5 py-3 border-t border-cc-border space-y-0.5">
          <Link
            href="/profile"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-cc-hover transition-colors tap-scale-sm"
            onClick={onClose}
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cc-accent to-cc-violet flex items-center justify-center text-white text-xs font-bold">
              {username?.[0]?.toUpperCase()}
            </div>
            <span className="text-sm text-cc-text font-mono truncate">{username}</span>
          </Link>
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-cc-muted hover:text-cc-hard hover:bg-cc-hard/5 transition-colors text-sm tap-scale-sm disabled:opacity-50"
          >
            <LogOut size={16} />
            {loggingOut ? "Signing out…" : "Sign out"}
          </button>
        </div>
      </aside>
    </>
  );
}

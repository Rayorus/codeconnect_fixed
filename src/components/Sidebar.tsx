"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Users,
  MessageSquare,
  TrendingUp,
  User,
  LogOut,
  BarChart3,
  Rss,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/feed", icon: Rss, label: "Feed" },
  { href: "/news", icon: BarChart3, label: "News" },
  { href: "/progress", icon: TrendingUp, label: "Progress" },
  { href: "/friends", icon: Users, label: "Friends" },
  { href: "/chat", icon: MessageSquare, label: "Messages" },
  { href: "/ai", icon: function RobotIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
      <svg width="22" height="22" viewBox="0 0 40 40" fill="none" {...props}>
        <rect x="8" y="12" width="24" height="16" rx="6" fill="#fff" stroke="#00796b" strokeWidth="2" />
        <circle cx="16" cy="20" r="2" fill="#00796b" />
        <circle cx="24" cy="20" r="2" fill="#00796b" />
        <rect x="18" y="26" width="4" height="2" rx="1" fill="#00796b" />
        <rect x="19" y="8" width="2" height="4" rx="1" fill="#00796b" />
      </svg>
    );
  }, label: "AI Mentor" },
  { href: "/profile", icon: User, label: "Profile" },
];

export default function Sidebar({ username, mobileOpen = false, onClose }: { username: string; mobileOpen?: boolean; onClose?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [displayName, setDisplayName] = useState<string | null>(null);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }
  return (
    <aside
      className={cn(
        "fixed left-0 top-0 h-full w-56 bg-lc-surface border-r border-lc-border flex flex-col z-30",
        "hidden md:flex",
        mobileOpen ? "flex animate-slide-in" : ""
      )}
      style={mobileOpen ? { display: "flex" } : undefined}
    >
      {/* Mobile close button */}
      {mobileOpen && (
        <button
          className="absolute top-4 right-4 z-40 p-2 rounded-lg bg-lc-card border border-lc-border md:hidden"
          aria-label="Close sidebar"
          onClick={onClose}
        >
          <span className="block w-6 h-0.5 bg-lc-text rotate-45 mb-1" />
          <span className="block w-6 h-0.5 bg-lc-text -rotate-45" />
        </button>
      )}
      {/* Logo */}
      <div className="px-4 py-5 border-b border-lc-border">
        <Link href="/dashboard" className="flex items-center gap-2">
          <span className="text-lc-accent font-mono font-bold text-lg">&lt;CC/&gt;</span>
          <span className="text-lc-text font-semibold">CodeConnect</span>
        </Link>
      </div>
      {/* Navigation */}
      <nav className="flex-1 px-2 py-4 space-y-1">
        {navItems.map(({ href, icon: Icon, label }) => {
          const isActive = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-lc-accent/10 text-lc-accent"
                  : "text-lc-muted hover:text-lc-text hover:bg-lc-hover"
              )}
            >
              <Icon size={16} />
              {label}
            </Link>
          );
        })}
      </nav>
      {/* User + Logout */}
      <div className="px-2 py-4 border-t border-lc-border space-y-1">
        <Link
          href="/profile"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-lc-hover transition-colors"
        >
          <div className="w-7 h-7 rounded-full bg-lc-accent/20 flex items-center justify-center text-lc-accent text-xs font-bold">
            {(displayName || username)?.[0]?.toUpperCase()}
          </div>
          <span className="text-sm text-lc-text font-mono truncate">{displayName || username}</span>
        </Link>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-lc-muted hover:text-lc-hard hover:bg-lc-hard/10 transition-colors text-sm"
        >
          <LogOut size={16} />
          Sign out
        </button>
      </div>
    </aside>
  );
}

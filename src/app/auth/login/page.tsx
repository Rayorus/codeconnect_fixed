"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push("/dashboard");
      router.refresh();
    }
  }

  async function handleGoogleSignIn() {
    setError(null);
    setLoading(true);
    try {
      await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      });
    } catch (err: any) {
      setError(err?.message || "Failed to start Google sign-in");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-lc-bg flex items-center justify-center px-4 w-full">
      <div className="w-full max-w-md mx-auto">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <span className="text-lc-accent font-mono font-bold text-2xl">&lt;CC/&gt;</span>
            <span className="text-lc-text font-semibold text-xl">CodeConnect</span>
          </Link>
          <p className="text-lc-muted text-sm mt-2">Sign in to your account</p>
        </div>

        <div className="bg-lc-surface border border-lc-border rounded-xl p-8">
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm text-lc-muted mb-1.5" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                className="w-full bg-lc-card border border-lc-border rounded-lg px-3 py-2.5 text-lc-text text-sm placeholder-lc-muted/50 focus:border-lc-accent focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm text-lc-muted mb-1.5" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full bg-lc-card border border-lc-border rounded-lg px-3 py-2.5 text-lc-text text-sm placeholder-lc-muted/50 focus:border-lc-accent focus:outline-none transition-colors"
              />
            </div>

            {error && (
              <div className="bg-lc-hard/10 border border-lc-hard/30 rounded-lg px-3 py-2.5 text-lc-hard text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-lc-accent text-lc-bg font-semibold py-2.5 rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity text-sm"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>

            <div className="mt-4">
              <button
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-lc-card border border-lc-border rounded-lg py-2 text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                <img src="/google-logo.svg" alt="Google" className="w-4 h-4" />
                <span>Continue with Google</span>
              </button>
            </div>
          </form>

          <p className="text-center text-sm text-lc-muted mt-6">
            Don&apos;t have an account?{" "}
            <Link href="/auth/signup" className="text-lc-accent hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

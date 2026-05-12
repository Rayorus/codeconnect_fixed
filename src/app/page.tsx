import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-lc-bg flex flex-col w-full px-4">
      {/* Nav */}
      <nav className="border-b border-lc-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lc-accent font-mono font-bold text-xl">&lt;CC/&gt;</span>
          <span className="text-lc-text font-semibold text-lg">CodeConnect</span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/auth/login"
            className="text-lc-muted hover:text-lc-text text-sm transition-colors px-3 py-1.5"
          >
            Sign in
          </Link>
          <Link
            href="/auth/signup"
            className="bg-lc-accent text-lc-bg text-sm font-semibold px-4 py-1.5 rounded hover:opacity-90 transition-opacity"
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-4 py-12 w-full">
        <div className="inline-flex items-center gap-2 bg-lc-surface border border-lc-border rounded-full px-4 py-1.5 mb-8 text-sm text-lc-muted">
          <span className="w-2 h-2 rounded-full bg-lc-easy animate-pulse inline-block" />
          Now in beta — join the community
        </div>

        <h1 className="text-5xl md:text-7xl font-bold text-lc-text mb-6 leading-tight">
          LeetCode,{" "}
          <span className="text-lc-accent">but social.</span>
        </h1>

        <p className="text-lc-muted text-lg md:text-xl max-w-2xl mb-10 leading-relaxed">
          Connect your LeetCode account, track your progress, post your doubts,
          and chat with fellow coders — all in one place.
        </p>

        <div className="flex gap-4 flex-wrap justify-center">
          <Link
            href="/auth/signup"
            className="bg-lc-accent text-lc-bg font-semibold px-8 py-3 rounded-lg hover:opacity-90 transition-opacity text-base"
          >
            Start for free
          </Link>
          <Link
            href="/auth/login"
            className="border border-lc-border text-lc-text font-medium px-8 py-3 rounded-lg hover:bg-lc-surface transition-colors text-base"
          >
            Sign in
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-lc-border px-6 py-16">
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              icon: "📊",
              title: "Track Progress",
              desc: "Auto-sync your LeetCode stats — easy, medium, hard counts refresh every 24h.",
            },
            {
              icon: "💬",
              title: "Encrypted Chat",
              desc: "Private real-time messaging with end-to-end encryption. Only friends can message.",
            },
            {
              icon: "🧩",
              title: "Post Doubts",
              desc: "Share problems you're stuck on. Get help from the community with tagged posts.",
            },
          ].map((f) => (
            <div
              key={f.title}
              className="bg-lc-surface border border-lc-border rounded-xl p-6 hover:border-lc-accent/40 transition-colors"
            >
              <div className="text-3xl mb-3">{f.icon}</div>
              <h3 className="text-lc-text font-semibold text-lg mb-2">{f.title}</h3>
              <p className="text-lc-muted text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-lc-border px-6 py-6 text-center text-lc-muted text-sm">
        <span className="font-mono text-lc-accent">&lt;CC/&gt;</span> CodeConnect — Built for the coding community
      </footer>
    </main>
  );
}

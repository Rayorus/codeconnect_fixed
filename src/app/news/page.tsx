"use client";
import { useRouter } from "next/navigation";
import NewsClient from "./NewsClient";

export default function NewsPage() {
  const router = useRouter();
  return (
    <div className="p-6 max-w-3xl mx-auto">
      <button
        className="mb-4 px-4 py-2 rounded bg-lc-card border border-lc-border text-sm hover:bg-lc-surface"
        onClick={() => router.back()}
      >
        ← Back
      </button>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">News</h1>
        <p className="text-sm text-lc-muted mt-1">Top Hacker News stories (tech)</p>
      </div>
      <div className="bg-lc-surface border border-lc-border rounded-xl p-5">
        <NewsClient />
      </div>
    </div>
  );
}

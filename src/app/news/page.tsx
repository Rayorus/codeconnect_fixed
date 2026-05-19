"use client";
import { useRouter } from "next/navigation";
import { ArrowLeft, Newspaper } from "lucide-react";
import NewsClient from "./NewsClient";

export default function NewsPage() {
  const router = useRouter();
  return (
    <div className="p-4 pt-14 md:pt-6 md:p-8 max-w-3xl mx-auto">
      <button
        className="mb-6 flex items-center gap-2 text-sm text-cc-muted hover:text-cc-text transition-colors px-3 py-1.5 rounded-lg hover:bg-cc-hover"
        onClick={() => router.back()}
      >
        <ArrowLeft size={14} />
        Back
      </button>
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-cc-text flex items-center gap-2">
          <Newspaper size={24} className="text-cc-accent-light" />
          News
        </h1>
        <p className="text-sm text-cc-muted mt-1">Top Hacker News stories (tech)</p>
      </div>
      <div className="glass-card !p-6">
        <NewsClient />
      </div>
    </div>
  );
}

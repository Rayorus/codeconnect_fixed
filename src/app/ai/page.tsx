"use client";
import { useRouter } from "next/navigation";
import AIMentor from '../../components/AIMentor.js';

export default function AIMentorPage() {
  const router = useRouter();
  return (
    <div className="p-6 max-w-3xl mx-auto">
      <button
        className="mb-4 px-4 py-2 rounded bg-lc-card border border-lc-border text-sm hover:bg-lc-surface"
        onClick={() => router.back()}
      >
        ← Back
      </button>
      <AIMentor />
    </div>
  );
}

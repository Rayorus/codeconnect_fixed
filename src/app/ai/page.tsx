"use client";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import AIMentor from '../../components/AIMentor.js';

export default function AIMentorPage() {
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
      <AIMentor />
    </div>
  );
}

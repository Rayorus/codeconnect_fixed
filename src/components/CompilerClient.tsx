
"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Play, ArrowLeft, Code2 } from "lucide-react";

const languages = [
  { value: "python", label: "Python" },
  { value: "c", label: "C" },
  { value: "cpp", label: "C++" },
  { value: "java", label: "Java" },
];

export default function CompilerClient() {
  const router = useRouter();
  const [language, setLanguage] = useState("python");
  const [code, setCode] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRun = async () => {
    setLoading(true);
    setOutput("");
    setError("");
    try {
      const res = await fetch("/api/compiler/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, language }),
      });
      const data = await res.json();
      setOutput(data.output || "");
      setError(data.error || "");
    } catch (err) {
      setError("Failed to run code.");
    }
    setLoading(false);
  };

  return (
    <div className="max-w-3xl mx-auto p-6 md:p-8 page-enter">
      <button
        className="mb-6 flex items-center gap-2 text-sm text-cc-muted hover:text-cc-text transition-colors px-3 py-1.5 rounded-lg hover:bg-cc-hover"
        onClick={() => router.back()}
      >
        <ArrowLeft size={14} />
        Back
      </button>

      <div className="glass-card !p-7">
        <h2 className="text-2xl font-bold text-cc-text mb-6 flex items-center gap-2">
          <Code2 size={22} className="text-cc-accent-light" />
          Code Compiler
        </h2>

        <div className="mb-5">
          <label htmlFor="language" className="block text-sm font-medium text-cc-muted mb-2">Select Language</label>
          <select
            id="language"
            className="glass-input w-full cursor-pointer"
            value={language}
            onChange={e => setLanguage(e.target.value)}
          >
            {languages.map(lang => (
              <option key={lang.value} value={lang.value} className="bg-cc-bg text-cc-text">{lang.label}</option>
            ))}
          </select>
        </div>

        <div className="mb-5">
          <label htmlFor="code" className="block text-sm font-medium text-cc-muted mb-2">Code</label>
          <textarea
            id="code"
            className="glass-input w-full h-56 font-mono text-sm resize-none"
            value={code}
            onChange={e => setCode(e.target.value)}
            placeholder="Write your code here..."
            spellCheck={false}
          />
        </div>

        <button
          className="btn-primary flex items-center gap-2 text-sm !px-6 !py-2.5"
          onClick={handleRun}
          disabled={loading || !code}
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Running...
            </span>
          ) : (
            <>
              <Play size={14} />
              Run Code
            </>
          )}
        </button>

        <div className="mt-6 space-y-4">
          <div>
            <h3 className="font-semibold text-cc-text mb-2 text-sm">Output</h3>
            <pre className="glass-card !p-4 !rounded-xl whitespace-pre-wrap text-cc-easy font-mono text-sm min-h-[50px]">{output || <span className="text-cc-muted/40">No output yet</span>}</pre>
          </div>
          {error && (
            <div>
              <h3 className="font-semibold text-cc-hard mb-2 text-sm">Error</h3>
              <pre className="bg-cc-hard/5 border border-cc-hard/20 p-4 rounded-xl whitespace-pre-wrap text-cc-hard font-mono text-sm min-h-[50px]">{error}</pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

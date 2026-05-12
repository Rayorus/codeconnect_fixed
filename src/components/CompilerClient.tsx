
"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";

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
    <div className="max-w-2xl mx-auto p-6 border border-lc-border rounded-xl bg-lc-card shadow-lg">
      <button
        className="mb-4 bg-lc-muted text-lc-text px-4 py-2 rounded-lg font-semibold shadow hover:bg-lc-hover transition"
        onClick={() => router.back()}
      >
        &larr; Back
      </button>
      <h2 className="text-2xl font-bold mb-4 text-lc-text">JDoodle Compiler</h2>
      <div className="mb-4">
        <label htmlFor="language" className="block text-sm font-semibold text-lc-muted mb-1">Select Language</label>
        <select
          id="language"
          className="p-2 border border-lc-border rounded-lg w-full bg-lc-bg text-lc-text focus:outline-none focus:ring-2 focus:ring-lc-accent"
          value={language}
          onChange={e => setLanguage(e.target.value)}
        >
          {languages.map(lang => (
            <option key={lang.value} value={lang.value}>{lang.label}</option>
          ))}
        </select>
      </div>
      <div className="mb-4">
        <label htmlFor="code" className="block text-sm font-semibold text-lc-muted mb-1">Code</label>
        <textarea
          id="code"
          className="w-full h-48 p-3 border border-lc-border rounded-lg font-mono bg-lc-bg text-lc-text focus:outline-none focus:ring-2 focus:ring-lc-accent"
          value={code}
          onChange={e => setCode(e.target.value)}
          placeholder="Write your code here..."
        />
      </div>
      <button
        className="bg-lc-accent text-white px-6 py-2 rounded-lg font-semibold shadow transition hover:bg-lc-accent/80 disabled:opacity-50"
        onClick={handleRun}
        disabled={loading || !code}
      >
        {loading ? "Running..." : "Run Code"}
      </button>
      <div className="mt-6">
        <h3 className="font-semibold text-lc-text mb-2">Output</h3>
        <pre className="bg-lc-bg border border-lc-border p-3 rounded-lg whitespace-pre-wrap text-lc-easy min-h-[40px]">{output}</pre>
        {error && (
          <>
            <h3 className="font-semibold text-lc-hard mt-4 mb-2">Error</h3>
            <pre className="bg-lc-hard/10 border border-lc-hard p-3 rounded-lg whitespace-pre-wrap text-lc-hard min-h-[40px]">{error}</pre>
          </>
        )}
      </div>
    </div>
  );
}

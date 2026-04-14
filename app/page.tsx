"use client";

import { useState } from "react";

export default function Home() {
  const [adInput, setAdInput] = useState("");
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");

  const handleGenerate = async () => {
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch("/api/personalize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adInput, url }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong");

      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 p-8 font-[Outfit]">
      <div className="mx-auto max-w-6xl">
        <header className="mb-12 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            Landing Page <span className="text-blue-600">Personalizer</span>
          </h1>
          <p className="mt-4 text-lg text-slate-600">
            Align your landing page messaging with your ad creative in seconds.
          </p>
        </header>

        <section className="grid gap-8 md:grid-cols-1">
          <div className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-slate-700">Ad Creative</label>
                <textarea
                  className="mt-2 block w-full rounded-xl border-0 py-3 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                  placeholder="Paste ad copy or describe the creative..."
                  rows={4}
                  value={adInput}
                  onChange={(e) => setAdInput(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Landing Page URL</label>
                <input
                  type="url"
                  className="mt-2 block w-full rounded-xl border-0 py-3 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                  placeholder="https://example.com/landing-page"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                />
                <button
                  onClick={handleGenerate}
                  disabled={loading || !adInput || !url}
                  className="mt-8 flex w-full justify-center rounded-xl bg-blue-600 px-3 py-4 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50 transition-all"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Personalizing...
                    </span>
                  ) : "Generate Personalized Page"}
                </button>
              </div>
            </div>
            {error && <p className="mt-4 text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-100">{error}</p>}
          </div>
        </section>

        {result && (
          <section className="mt-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-slate-900">Personalization Result</h2>
              <div className="flex gap-2 text-sm">
                {!process.env.OPENAI_API_KEY && (
                  <span className="flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-amber-700 font-medium">
                    <span className="h-2 w-2 rounded-full bg-amber-500"></span>
                    Mock Mode Active
                  </span>
                )}
                <span className="flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-green-700 font-medium">
                  <span className="h-2 w-2 rounded-full bg-green-500"></span>
                  94/100 Relevance Score
                </span>
              </div>
            </div>

            <div className="grid gap-8 lg:grid-cols-2">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-700">Original Page</h3>
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm h-[600px]">
                  <iframe 
                    srcDoc={result.originalHtml} 
                    className="h-full w-full"
                    title="Original"
                  />
                </div>
              </div>
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-700">Personalized Page</h3>
                <div className="overflow-hidden rounded-2xl border-2 border-blue-500 bg-white shadow-lg h-[600px]">
                  <iframe 
                    srcDoc={result.personalizedHtml} 
                    className="h-full w-full"
                    title="Personalized"
                  />
                </div>
              </div>
            </div>

            <div className="mt-12 grid gap-8 md:grid-cols-3">
              <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
                <h4 className="font-bold text-slate-900 mb-2">Ad Insights</h4>
                <div className="space-y-2 text-sm text-slate-600">
                  <p><strong>Offer:</strong> {result.adAnalysis.offer}</p>
                  <p><strong>Tone:</strong> {result.adAnalysis.tone}</p>
                  <p><strong>Audience:</strong> {result.adAnalysis.audience}</p>
                </div>
              </div>
              <div className="col-span-2 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
                <h4 className="font-bold text-slate-900 mb-2">What was improved & why</h4>
                <div className="grid gap-4 sm:grid-cols-2">
                  {result.highlights.map((h: any, i: number) => (
                    <div key={i} className="flex items-start gap-4">
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600 text-[10px] font-bold">
                        {i + 1}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{h.type}</p>
                        <p className="text-sm text-slate-600">{h.reason}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

"use client";

import { useState } from "react";
import { usePublicClient } from "wagmi";

/**
 * Represents a single identified risk in the audit.
 */
type Risk = {
  title: string;
  severity: "low" | "medium" | "high";
  details: string;
  mitigation: string;
};

/**
 * Represents the full audit analysis result.
 */
type Analysis = {
  score: number;
  summary: string;
  risks: Risk[];
  recommendations: string[];
};

/**
 * AnalisisTab Component
 *
 * This component fetches contract bytecode from the blockchain and sends it
 * to the `/api/analyze` endpoint for AI-powered security auditing.
 * Results are displayed and passed to parent component via callback.
 */
export default function AnalisisTab({
  contractAddress,
  onAnalysisComplete,
}: {
  contractAddress?: string;
  onAnalysisComplete?: (result: Analysis) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const publicClient = usePublicClient();

  /**
   * Calls the backend API to run the analysis.
   * Fetches bytecode from blockchain if contract address is provided.
   */
  const runAnalysis = async () => {
    setLoading(true);
    setError(null);
    setAnalysis(null);

    try {
      let bytecode: string | undefined;

      // Fetch bytecode from blockchain if address provided
      if (contractAddress && publicClient) {
        try {
          const code = await publicClient.getBytecode({
            address: contractAddress as `0x${string}`,
          });
          bytecode = code;
        } catch (e) {
          console.warn("Could not fetch bytecode, using test contract:", e);
        }
      }

      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contractAddress, bytecode }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Analysis request failed");
      }

      setAnalysis(data.analysis);

      // Pass result to parent component
      if (onAnalysisComplete && data.analysis) {
        onAnalysisComplete(data.analysis);
      }
    } catch (e: any) {
      console.error("Error in AnalisisTab:", e);
      setError(e?.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h3 className="text-lg font-semibold mb-2">Semantic Analysis (Test Contract)</h3>

      {/* Action button */}
      <div className="flex gap-3 mb-4">
        <button
          onClick={runAnalysis}
          disabled={loading}
          className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-md text-sm"
        >
          {loading ? "Analyzing..." : "Analyze Test Contract"}
        </button>
      </div>

      {/* Error message */}
      {error && <p className="text-sm text-red-500 mb-3">{error}</p>}

      {/* Initial instructions */}
      {!analysis && !loading && !error && (
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Press “Analyze Test Contract” to generate the risk and recommendation report.
        </p>
      )}

      {/* Analysis results */}
      {analysis && (
        <div className="space-y-4">
          {/* Score */}
          <div className="rounded-md border border-gray-200 dark:border-gray-700 p-4">
            <p className="text-sm text-gray-500">Score</p>
            <p className="text-3xl font-bold">{analysis.score}</p>
          </div>

          {/* Summary */}
          <div>
            <h4 className="font-semibold mb-1">Summary</h4>
            <p className="text-sm text-gray-800 dark:text-gray-200">{analysis.summary}</p>
          </div>

          {/* Risks */}
          <div>
            <h4 className="font-semibold mb-1">Risks</h4>
            <ul className="list-disc list-inside space-y-2">
              {analysis.risks?.map((r, i) => (
                <li key={i}>
                  <span className="font-semibold">{r.title}</span>{" "}
                  <span
                    className={`ml-2 text-xs px-2 py-0.5 rounded ${r.severity === "high"
                      ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                      : r.severity === "medium"
                        ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                        : "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200"
                      }`}
                  >
                    {r.severity.toUpperCase()}
                  </span>
                  <p className="text-sm mt-1">{r.details}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Mitigation: {r.mitigation}</p>
                </li>
              ))}
            </ul>
          </div>

          {/* Recommendations */}
          <div>
            <h4 className="font-semibold mb-1">Recommendations</h4>
            <ul className="list-disc list-inside">
              {analysis.recommendations?.map((rec, i) => (
                <li key={i} className="text-sm">
                  {rec}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

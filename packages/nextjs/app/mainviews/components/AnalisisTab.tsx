"use client";

import { useState } from "react";

type Risk = { title: string; severity: "low" | "medium" | "high"; details: string; mitigation: string };
type Analysis = { score: number; summary: string; risks: Risk[]; recommendations: string[] };

export default function AnalisisTab() {
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runAnalysis = async () => {
    setLoading(true);
    setError(null);
    setAnalysis(null);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}), // no enviamos nada, el endpoint usa contrato de prueba
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Error en análisis");
      }

      setAnalysis(data.analysis);
    } catch (e: any) {
      console.error("Error en AnalisisTab:", e);
      setError(e?.message || "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h3 className="text-lg font-semibold mb-2">Análisis Semántico (Contrato de prueba)</h3>

      <div className="flex gap-3 mb-4">
        <button
          onClick={runAnalysis}
          disabled={loading}
          className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-md text-sm"
        >
          {loading ? "Analizando..." : "Analizar contrato de prueba"}
        </button>
      </div>

      {error && (
        <p className="text-sm text-red-500 mb-3">
          {error}
        </p>
      )}

      {!analysis && !loading && !error && (
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Presiona “Analizar contrato de prueba” para generar el informe de riesgos y recomendaciones.
        </p>
      )}

      {analysis && (
        <div className="space-y-4">
          <div className="rounded-md border border-gray-200 dark:border-gray-700 p-4">
            <p className="text-sm text-gray-500">Puntaje</p>
            <p className="text-3xl font-bold">{analysis.score}</p>
          </div>

          <div>
            <h4 className="font-semibold mb-1">Resumen</h4>
            <p className="text-sm text-gray-800 dark:text-gray-200">{analysis.summary}</p>
          </div>

          <div>
            <h4 className="font-semibold mb-1">Riesgos</h4>
            <ul className="list-disc list-inside space-y-2">
              {analysis.risks?.map((r, i) => (
                <li key={i}>
                  <span className="font-semibold">{r.title}</span>{" "}
                  <span
                    className={`ml-2 text-xs px-2 py-0.5 rounded ${
                      r.severity === "high"
                        ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                        : r.severity === "medium"
                        ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                        : "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200"
                    }`}
                  >
                    {r.severity.toUpperCase()}
                  </span>
                  <p className="text-sm mt-1">{r.details}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    Mitigación: {r.mitigation}
                  </p>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-1">Recomendaciones</h4>
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
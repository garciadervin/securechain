"use client";

import { useState } from "react";
import type { NextPage } from "next";

type RiskLevel = "low" | "medium" | "high";

const ResultsPage: NextPage = () => {
  const [activeTab, setActiveTab] = useState<"resumen" | "analisis" | "chat">("resumen");

  // Ejemplo de datos
  const riskScore = 9.1;
  const riskLevel: RiskLevel = riskScore >= 7 ? "low" : riskScore >= 4 ? "medium" : "high";
  const criticalVulns: string[] = [];

  const getRiskColor = () => {
    switch (riskLevel) {
      case "low":
        return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200";
      case "medium":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "high":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 flex flex-col items-center px-6 py-10">
      {/* Tarjeta de resumen */}
      <div
        className={`w-full max-w-3xl rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 text-center ${getRiskColor()}`}
      >
        <h2 className="text-sm uppercase tracking-wide font-medium">Puntuación de Riesgo</h2>
        <p className="text-5xl font-bold mt-2">{riskScore}</p>
        <span className="block mt-1 text-lg font-semibold">
          {riskLevel === "low" && "SEGURO"}
          {riskLevel === "medium" && "ADVERTENCIA"}
          {riskLevel === "high" && "PELIGROSO"}
        </span>
      </div>

      {/* Tabs */}
      <div className="mt-8 w-full max-w-3xl border-b border-gray-200 dark:border-gray-700 flex">
        {[
          { id: "resumen", label: "Resumen" },
          { id: "analisis", label: "Análisis Semántico" },
          { id: "chat", label: "Chatbot" },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? "border-gray-900 dark:border-white text-gray-900 dark:text-white"
                : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Contenido de pestañas */}
      <div className="mt-6 w-full max-w-3xl text-gray-800 dark:text-gray-200">
        {activeTab === "resumen" && (
          <div>
            <h3 className="text-lg font-semibold mb-2">Puntuación de riesgo</h3>
            <p className="mb-4">Este contrato tiene una puntuación de {riskScore} sobre 10.</p>

            <h3 className="text-lg font-semibold mb-2">Vulnerabilidades críticas</h3>
            {criticalVulns.length === 0 ? (
              <p>No se encontraron vulnerabilidades críticas.</p>
            ) : (
              <ul className="list-disc list-inside space-y-1">
                {criticalVulns.map((v, i) => (
                  <li key={i}>{v}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        {activeTab === "analisis" && (
          <div>
            <h3 className="text-lg font-semibold mb-2">Análisis Semántico</h3>
            <p className="mb-4">
              Este contrato implementa funciones para gestionar depósitos y retiros de forma segura. Se detectaron
              patrones de código que indican buenas prácticas en el manejo de fondos.
            </p>
            <h4 className="font-semibold mb-1">Vulnerabilidades detectadas</h4>
            <ul className="list-disc list-inside space-y-1">
              <li>No se encontraron vulnerabilidades críticas.</li>
              <li>Se recomienda revisar el control de acceso en funciones administrativas.</li>
            </ul>
          </div>
        )}

        {activeTab === "chat" && (
          <div className="flex flex-col h-96 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            <div className="flex-1 p-4 overflow-y-auto space-y-3">
              <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg max-w-xs">
                Hola, puedo responder preguntas sobre el análisis de este contrato.
              </div>
            </div>
            <div className="p-3 border-t border-gray-200 dark:border-gray-700 flex gap-2">
              <input
                type="text"
                placeholder="Escribe tu pregunta..."
                className="flex-1 px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
              <button className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-md text-sm">
                Enviar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResultsPage;

"use client";

import { useState } from "react";
import AnalisisTab from "./components/AnalisisTab";
import ChatbotTab from "./components/ChatbotTab";
import ResumenTab from "./components/ResumenTab";
import type { NextPage } from "next";

type RiskLevel = "low" | "medium" | "high";
type Tab = "resumen" | "analisis" | "chat";

const ResultsPage: NextPage = () => {
  const [activeTab, setActiveTab] = useState<Tab>("resumen");

  const auditData = {
    auditedContract: "0x000000000000000000000000000000000000dEaD",
    chainId: 31337,
    score: 95,
    cid: "QmHashDeEjemplo",
    to: "0x1234567890abcdef1234567890abcdef12345678",
    tokenId: 1,
  };

  const riskLevel: RiskLevel = auditData.score >= 80 ? "low" : auditData.score >= 50 ? "medium" : "high";

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
      {/* Encabezado */}
      <header className="w-full max-w-4xl mb-6">
        <h1 className="text-3xl font-bold text-emerald-500 mb-2">SecureChain</h1>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Contrato auditado: <span className="font-mono">{auditData.auditedContract}</span> | Chain ID:{" "}
          {auditData.chainId}
        </div>
      </header>

      {/* Tarjeta de riesgo */}
      <div
        className={`w-full max-w-4xl rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 text-center ${getRiskColor()}`}
      >
        <h2 className="text-sm uppercase tracking-wide font-medium">Puntuación de Riesgo</h2>
        <p className="text-5xl font-bold mt-2">{auditData.score}</p>
        <span className="block mt-1 text-lg font-semibold">
          {riskLevel === "low" && "SEGURO"}
          {riskLevel === "medium" && "ADVERTENCIA"}
          {riskLevel === "high" && "PELIGROSO"}
        </span>
      </div>

      {/* Tabs */}
      <div className="mt-8 w-full max-w-4xl border-b border-gray-200 dark:border-gray-700 flex">
        {(["resumen", "analisis", "chat"] as Tab[]).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab
                ? "border-gray-900 dark:border-white text-gray-900 dark:text-white"
                : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            }`}
          >
            {tab === "resumen" && "Resumen"}
            {tab === "analisis" && "Análisis Semántico"}
            {tab === "chat" && "Chatbot"}
          </button>
        ))}
      </div>

      {/* Contenido */}
      <div className="mt-6 w-full max-w-4xl text-gray-800 dark:text-gray-200">
        {activeTab === "resumen" && <ResumenTab auditData={auditData} />}
        {activeTab === "analisis" && <AnalisisTab auditData={auditData} />}
        {activeTab === "chat" && <ChatbotTab auditData={auditData} />}
      </div>
    </div>
  );
};

export default ResultsPage;

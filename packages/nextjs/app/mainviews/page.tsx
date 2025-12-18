"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import UnifiedAuditView from "./components/UnifiedAuditView";
import ChatbotTab from "./components/ChatbotTab";
import ResumenTab from "./components/ResumenTab";
import type { NextPage } from "next";
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth";
import { Address } from "~~/components/scaffold-eth";

type RiskLevel = "low" | "medium" | "high";
type Tab = "resumen" | "analisis" | "chat";

// Analysis result type
type AnalysisResult = {
  score: number;
  summary: string;
  risks: Array<{
    title: string;
    severity: "low" | "medium" | "high";
    details: string;
    mitigation: string;
  }>;
  recommendations: string[];
};

/**
 * ResultsPageContent Component
 *
 * Displays the audit results in three tabs:
 *  - Summary (ResumenTab)
 *  - Semantic Analysis (AnalisisTab)
 *  - Chatbot (ChatbotTab)
 *
 * Fetches audit data from the blockchain based on the contract address in the URL.
 */
function ResultsPageContent() {
  const [activeTab, setActiveTab] = useState<Tab>("resumen");
  const searchParams = useSearchParams();
  const contractAddress = searchParams.get("address") as `0x${string}` | null;

  // State for sharing analysis results between tabs (creation mode)
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);

  // Fetch audits for the given contract address
  const { data: audits, isLoading: isLoadingAudits } = useScaffoldReadContract({
    contractName: "ProofOfAudit",
    functionName: "getAuditsByContract",
    args: contractAddress ? [contractAddress] : undefined,
    query: {
      enabled: !!contractAddress,
    },
  });

  // Get the latest audit token ID
  const latestTokenId = audits && audits.length > 0 ? audits[audits.length - 1] : undefined;

  // Fetch audit summary for the latest token
  const { data: auditSummary, isLoading: isLoadingSummary } = useScaffoldReadContract({
    contractName: "ProofOfAudit",
    functionName: "auditSummary",
    args: latestTokenId !== undefined ? [latestTokenId] : undefined,
    query: {
      enabled: latestTokenId !== undefined,
    },
  });

  const isLoading = isLoadingAudits || isLoadingSummary;

  // Parse audit data from contract response
  const auditData = auditSummary
    ? {
      owner: auditSummary[0],
      auditedContract: auditSummary[1],
      chainId: Number(auditSummary[2]),
      score: auditSummary[3],
      cid: auditSummary[4],
      auditor: auditSummary[5],
      timestamp: Number(auditSummary[6]),
      revoked: auditSummary[7],
      tokenId: Number(latestTokenId),
    }
    : null;

  // Determine risk level based on score
  const riskLevel: RiskLevel = auditData
    ? auditData.score >= 80
      ? "low"
      : auditData.score >= 50
        ? "medium"
        : "high"
    : "medium";

  // Return Tailwind classes for the risk card based on risk level
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

  // Handle no contract address
  if (!contractAddress) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex flex-col items-center justify-center px-6">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">No Contract Address</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Please provide a contract address in the URL parameter.
          </p>
          <a
            href="/"
            className="inline-block px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-md font-medium transition-colors"
          >
            Go to Home
          </a>
        </div>
      </div>
    );
  }

  // Handle loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex flex-col items-center justify-center px-6">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading audit data...</p>
        </div>
      </div>
    );
  }

  // Handle no audit found - Show unified audit view
  if (!auditData || !audits || audits.length === 0) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex flex-col items-center px-6 py-10">
        {/* Header */}
        <header className="w-full max-w-4xl mb-6">
          <h1 className="text-3xl font-bold text-emerald-500 mb-2">SecureChain</h1>
          <div className="text-sm text-gray-600 dark:text-gray-400 flex flex-wrap items-center gap-2">
            <span>Auditing contract:</span>
            <Address address={contractAddress} />
          </div>
        </header>

        {/* Unified Audit View */}
        <UnifiedAuditView contractAddress={contractAddress} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 flex flex-col items-center px-6 py-10">
      {/* Header */}
      <header className="w-full max-w-4xl mb-6">
        <h1 className="text-3xl font-bold text-emerald-500 mb-2">SecureChain</h1>
        <div className="text-sm text-gray-600 dark:text-gray-400 flex flex-wrap items-center gap-2">
          <span>Audited contract:</span>
          <Address address={auditData.auditedContract as `0x${string}`} />
          <span>| Chain ID: {auditData.chainId}</span>
          {auditData.revoked && (
            <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 rounded text-xs font-semibold">
              REVOKED
            </span>
          )}
        </div>
      </header>

      {/* Risk score card */}
      <div
        className={`w-full max-w-4xl rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 text-center ${getRiskColor()}`}
      >
        <h2 className="text-sm uppercase tracking-wide font-medium">Risk Score</h2>
        <p className="text-5xl font-bold mt-2">{auditData.score}</p>
        <span className="block mt-1 text-lg font-semibold">
          {riskLevel === "low" && "SAFE"}
          {riskLevel === "medium" && "WARNING"}
          {riskLevel === "high" && "DANGEROUS"}
        </span>
      </div>

      {/* Tabs */}
      <div className="mt-8 w-full max-w-4xl border-b border-gray-200 dark:border-gray-700 flex">
        {(["resumen", "analisis", "chat"] as Tab[]).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === tab
              ? "border-gray-900 dark:border-white text-gray-900 dark:text-white"
              : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              }`}
          >
            {tab === "resumen" && "Summary"}
            {tab === "analisis" && "Semantic Analysis"}
            {tab === "chat" && "Chatbot"}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="mt-6 w-full max-w-4xl text-gray-800 dark:text-gray-200">
        {activeTab === "resumen" && <ResumenTab auditData={auditData} />}
        {activeTab === "analisis" && <AnalisisTab contractAddress={contractAddress} />}
        {activeTab === "chat" && <ChatbotTab />}
      </div>
    </div>
  );
}

/**
 * ResultsPage Component with Suspense wrapper
 */
const ResultsPage: NextPage = () => {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading...</p>
          </div>
        </div>
      }
    >
      <ResultsPageContent />
    </Suspense>
  );
};

export default ResultsPage;

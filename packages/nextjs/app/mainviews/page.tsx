"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import UnifiedAuditView from "./components/UnifiedAuditView";
import type { NextPage } from "next";
import { Address } from "~~/components/scaffold-eth";

/**
 * ResultsPageContent Component
 *
 * Displays audit results using UnifiedAuditView.
 * Fetches audit data from the blockchain based on the contract address in the URL.
 */
function ResultsPageContent() {
  const searchParams = useSearchParams();
  const contractAddress = searchParams.get("address") as `0x${string}` | null;

  // No contract address provided
  if (!contractAddress) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex flex-col items-center justify-center px-6">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">No Contract Address</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Please provide a contract address in the URL to view audit results.
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

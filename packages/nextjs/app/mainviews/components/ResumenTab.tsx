"use client";

import { useState } from "react";
import { toPng } from "html-to-image";
import { QRCodeSVG } from "qrcode.react";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { useAccount } from "wagmi";

/**
 * Represents the audit data structure.
 */
export interface AuditData {
  owner: string;
  auditedContract: string;
  chainId: number;
  score: number;
  cid: string;
  auditor: string;
  timestamp: number;
  revoked: boolean;
  tokenId: number;
}

/**
 * ResumenTab Component
 *
 * Displays audit details, allows the user to generate a Proof-of-Audit NFT,
 * and provides a QR code linking to the audit report.
 */
export default function ResumenTab({
  auditData,
  analysisResult,
}: {
  auditData: AuditData | null;
  analysisResult?: {
    score: number;
    summary: string;
    risks: Array<{ title: string; severity: string; details: string; mitigation: string }>;
    recommendations: string[];
  } | null;
}) {
  const { address: connectedAddress } = useAccount();
  const [showNFTModal, setShowNFTModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);

  // Creation mode state (only for IPFS CID)
  const [cid, setCid] = useState("QmExampleCID123456789");

  if (!auditData) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600 dark:text-gray-400 mb-4">No audit data available.</p>
      </div>
    );
  }

  // Check if we're in creation mode (no existing audit)
  const isCreationMode = auditData.tokenId === 0;

  // Determine QR code value (IPFS link or fallback URL)
  const qrValue =
    (isCreationMode ? cid : auditData.cid) && (isCreationMode ? cid : auditData.cid).length > 0
      ? `https://ipfs.io/ipfs/${isCreationMode ? cid : auditData.cid}`
      : `${typeof window !== "undefined" ? window.location.origin : "https://securechain.app"}/audit/${auditData.tokenId ?? ""
      }`;

  /**
   * Downloads the QR code as a PNG image.
   */
  const handleDownloadQR = async () => {
    const node = document.getElementById("qr-container");
    if (!node) return;
    const dataUrl = await toPng(node);
    const link = document.createElement("a");
    link.download = `securechain-audit-${auditData.tokenId ?? "qr"}.png`;
    link.href = dataUrl;
    link.click();
  };

  // Creation mode UI
  if (isCreationMode) {
    // Use AI score if available, otherwise 0
    const score = analysisResult?.score || 0;
    const hasAnalysis = !!analysisResult;

    return (
      <>
        <h3 className="text-lg font-semibold mb-4">Create New Audit Certificate</h3>

        {!hasAnalysis && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              ⚠️ <strong>No AI Analysis Yet:</strong> Please run the AI Analysis first to get an automated security
              score. Go to the "AI Analysis" tab and click "Analyze Test Contract".
            </p>
          </div>
        )}

        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 mb-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Contract Address
            </label>
            <p className="font-mono text-sm bg-white dark:bg-gray-900 p-3 rounded border border-gray-200 dark:border-gray-700 break-all">
              {auditData.auditedContract}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              AI-Generated Audit Score
            </label>
            <div className="flex items-center gap-3">
              <div className="flex-1 bg-white dark:bg-gray-900 p-3 rounded border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold">{score}</span>
                  <span className="text-sm">
                    {score >= 80 ? "🟢 Safe" : score >= 50 ? "🟡 Warning" : score > 0 ? "🔴 Dangerous" : "⚪ Pending"}
                  </span>
                </div>
              </div>
            </div>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {hasAnalysis
                ? "Score determined by AI analysis (read-only)"
                : "Run AI Analysis to get automated score"}
            </p>
          </div>

          <div>
            <label htmlFor="cid" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              IPFS CID (Audit Report)
            </label>
            <input
              id="cid"
              type="text"
              value={cid}
              onChange={e => setCid(e.target.value)}
              placeholder="QmExampleCID123456789..."
              className="w-full px-4 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent font-mono text-sm"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Upload your audit report to IPFS and paste the CID here
            </p>
          </div>

          {hasAnalysis && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <p className="text-sm text-blue-800 dark:text-blue-200 mb-2">
                <strong>AI Analysis Summary:</strong>
              </p>
              <p className="text-xs text-blue-700 dark:text-blue-300">{analysisResult.summary}</p>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setShowNFTModal(true)}
            disabled={!cid || !hasAnalysis || score < 1}
            className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-md text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Mint Audit Certificate NFT
          </button>
          <button
            onClick={() => setShowQRModal(true)}
            disabled={!cid}
            className="px-4 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md text-sm hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Preview QR Code
          </button>
        </div>

        {/* NFT Modal */}
        <LocalModal open={showNFTModal} onClose={() => setShowNFTModal(false)} title="Mint Audit Certificate NFT">
          <NFTModalContent
            auditData={{
              to: connectedAddress || "0x0000000000000000000000000000000000000000",
              auditedContract: auditData.auditedContract,
              chainId: auditData.chainId,
              score: score,
              cid: cid,
            }}
            onClose={() => setShowNFTModal(false)}
          />
        </LocalModal>

        {/* QR Modal */}
        <LocalModal open={showQRModal} onClose={() => setShowQRModal(false)} title="Verification QR Code Preview">
          <div className="flex flex-col items-center">
            <div id="qr-container" className="bg-white p-4 rounded-md dark:bg-gray-900">
              <QRCodeSVG value={qrValue} size={200} bgColor="#FFFFFF" fgColor="#000000" level="H" />
            </div>
            <p className="mt-4 text-sm text-gray-600 dark:text-gray-300 text-center">
              Scan this code to view the full audit report on IPFS.
            </p>
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setShowQRModal(false)}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-md text-sm text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                Close
              </button>
              <button
                onClick={handleDownloadQR}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-md text-sm transition-colors"
              >
                Download QR
              </button>
            </div>
          </div>
        </LocalModal>
      </>
    );
  }

  // Existing audit display mode
  return (
    <>
      <h3 className="text-lg font-semibold mb-4">Audit Certificate Details</h3>

      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-6 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Token ID</p>
            <p className="font-mono text-sm">{auditData.tokenId}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Owner</p>
            <p className="font-mono text-sm truncate">{auditData.owner}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Auditor</p>
            <p className="font-mono text-sm truncate">{auditData.auditor}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Timestamp</p>
            <p className="text-sm">{new Date(auditData.timestamp * 1000).toLocaleString()}</p>
          </div>
        </div>

        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Audited Contract</p>
          <p className="font-mono text-sm break-all">{auditData.auditedContract}</p>
        </div>

        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">IPFS Report</p>
          <a
            href={`https://ipfs.io/ipfs/${auditData.cid}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-500 hover:underline text-sm font-mono break-all"
          >
            {auditData.cid}
          </a>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-3 mt-6">
        <button
          onClick={() => setShowNFTModal(true)}
          className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-md text-sm font-medium transition-colors"
        >
          Mint New Audit NFT
        </button>
        <button
          onClick={() => setShowQRModal(true)}
          className="px-4 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md text-sm hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        >
          Generate QR Code
        </button>
      </div>

      {/* NFT Modal */}
      <LocalModal open={showNFTModal} onClose={() => setShowNFTModal(false)} title="Mint Audit Certificate NFT">
        <NFTModalContent
          auditData={{
            to: connectedAddress || auditData.owner,
            auditedContract: auditData.auditedContract,
            chainId: auditData.chainId,
            score: auditData.score,
            cid: auditData.cid,
          }}
          onClose={() => setShowNFTModal(false)}
        />
      </LocalModal>

      {/* QR Modal */}
      <LocalModal open={showQRModal} onClose={() => setShowQRModal(false)} title="Verification QR Code">
        <div className="flex flex-col items-center">
          <div id="qr-container" className="bg-white p-4 rounded-md dark:bg-gray-900">
            <QRCodeSVG value={qrValue} size={200} bgColor="#FFFFFF" fgColor="#000000" level="H" />
          </div>
          <p className="mt-4 text-sm text-gray-600 dark:text-gray-300 text-center">
            Scan this code to view the full audit report on IPFS.
          </p>
          <div className="flex gap-3 mt-4">
            <button
              onClick={() => setShowQRModal(false)}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-md text-sm text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              Close
            </button>
            <button
              onClick={handleDownloadQR}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-md text-sm transition-colors"
            >
              Download QR
            </button>
          </div>
        </div>
      </LocalModal>
    </>
  );
}

/**
 * NFTModalContent Component
 *
 * Handles the minting of a Proof-of-Audit NFT using the provided audit data.
 */
function NFTModalContent({
  auditData,
  onClose,
}: {
  auditData: {
    to: string;
    auditedContract: string;
    chainId: number;
    score: number;
    cid: string;
  };
  onClose: () => void;
}) {
  const { writeContractAsync: writeProofOfAuditAsync, isMining } = useScaffoldWriteContract({
    contractName: "ProofOfAudit",
  });

  const handleMint = async () => {
    try {
      await writeProofOfAuditAsync({
        functionName: "mintAudit",
        args: [
          auditData.to as `0x${string}`,
          auditData.auditedContract as `0x${string}`,
          BigInt(auditData.chainId),
          auditData.score,
          auditData.cid,
        ],
      });
      onClose();
    } catch (e) {
      console.error("Error generating NFT:", e);
    }
  };

  return (
    <div className="flex flex-col items-center">
      <div className="w-full h-56 bg-gradient-to-br from-emerald-500 to-emerald-700 flex flex-col items-center justify-center text-white rounded-lg mb-4 p-4">
        <span className="text-xl font-bold mb-2">SecureChain</span>
        <span className="text-sm mb-3">Proof-of-Audit NFT</span>
        <div className="bg-white/10 backdrop-blur-sm rounded px-3 py-2 w-full">
          <p className="font-mono text-xs truncate text-center">{auditData.auditedContract}</p>
        </div>
        <div className="mt-3 flex gap-4">
          <span className="text-sm">Score: <span className="font-bold">{auditData.score}</span></span>
          <span className="text-sm">Chain: <span className="font-bold">{auditData.chainId}</span></span>
        </div>
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-300 text-center mb-4">
        This NFT will be minted as proof of the audit on the blockchain.
      </p>
      <div className="flex gap-3">
        <button
          onClick={onClose}
          className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-md text-sm text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleMint}
          disabled={isMining}
          className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isMining ? "Minting..." : "Mint NFT"}
        </button>
      </div>
    </div>
  );
}

/**
 * LocalModal Component
 *
 * A simple reusable modal wrapper.
 */
function LocalModal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-md rounded-lg bg-white dark:bg-gray-900 shadow-lg">
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 px-5 py-4">
          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
          <button
            onClick={onClose}
            className="rounded-md px-2 py-1 text-sm text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            Close
          </button>
        </div>
        <div className="px-5 py-4">{children}</div>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { toPng } from "html-to-image";
import { QRCodeSVG } from "qrcode.react";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth";

/**
 * Represents the audit data structure.
 */
export interface AuditData {
  auditedContract: string;
  chainId: number;
  score: number;
  cid: string;
  to: string;
  tokenId?: number;
}

/**
 * ResumenTab Component
 *
 * Displays audit details, allows the user to generate a Proof-of-Audit NFT,
 * and provides a QR code linking to the audit report.
 */
export default function ResumenTab() {
  // Example static audit data (replace with real data in production)
  const auditData: AuditData = {
    auditedContract: "0x1234567890abcdef1234567890abcdef12345678",
    chainId: 1,
    score: 85,
    cid: "QmTestExampleCID1234567890abcdef",
    to: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
    tokenId: 1,
  };

  const [showNFTModal, setShowNFTModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);

  // Determine QR code value (IPFS link or fallback URL)
  const qrValue =
    auditData.cid && auditData.cid.length > 0
      ? `https://ipfs.io/ipfs/${auditData.cid}`
      : `${
          typeof window !== "undefined" ? window.location.origin : "https://securechain.app"
        }/audit/${auditData.tokenId ?? ""}`;

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

  return (
    <>
      <h3 className="text-lg font-semibold mb-2">Audit Data (Test)</h3>
      <ul className="list-disc list-inside space-y-1 mb-4">
        <li>
          <strong>Audit for:</strong> <span className="font-mono">{auditData.to}</span>
        </li>
        <li>
          <strong>Audited contract:</strong> <span className="font-mono">{auditData.auditedContract}</span>
        </li>
        <li>
          <strong>Chain ID:</strong> {auditData.chainId}
        </li>
        <li>
          <strong>IPFS Report:</strong>{" "}
          <a
            href={`https://ipfs.io/ipfs/${auditData.cid}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-500 hover:underline"
          >
            {auditData.cid}
          </a>
        </li>
      </ul>

      {/* Action buttons */}
      <div className="flex gap-4 mt-6">
        <button
          onClick={() => setShowNFTModal(true)}
          className="px-4 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md text-sm hover:bg-gray-200 dark:hover:bg-gray-700"
        >
          Generate Certification NFT
        </button>
        <button
          onClick={() => setShowQRModal(true)}
          className="px-4 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md text-sm hover:bg-gray-200 dark:hover:bg-gray-700"
        >
          Generate QR Code
        </button>
      </div>

      {/* NFT Modal */}
      <LocalModal open={showNFTModal} onClose={() => setShowNFTModal(false)} title="Generate Certification NFT">
        <NFTModalContent auditData={auditData} onClose={() => setShowNFTModal(false)} />
      </LocalModal>

      {/* QR Modal */}
      <LocalModal open={showQRModal} onClose={() => setShowQRModal(false)} title="Generate Verification QR Code">
        <div className="flex flex-col items-center">
          <div id="qr-container" className="bg-white p-2 rounded-md dark:bg-gray-900">
            <QRCodeSVG value={qrValue} size={160} bgColor="#FFFFFF" fgColor="#000000" level="H" />
          </div>
          <p className="mt-3 text-sm text-gray-600 dark:text-gray-300 text-center">
            Scan this code to view the full audit.
          </p>
          <div className="flex gap-3 mt-4">
            <button
              onClick={() => setShowQRModal(false)}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-md text-sm text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600"
            >
              Close
            </button>
            <button
              onClick={handleDownloadQR}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-md text-sm"
            >
              Download
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
function NFTModalContent({ auditData, onClose }: { auditData: AuditData; onClose: () => void }) {
  const { writeContractAsync: writeProofOfAuditAsync, isMining } = useScaffoldWriteContract({
    contractName: "ProofOfAudit",
  });

  const handleMint = async () => {
    try {
      await writeProofOfAuditAsync({
        functionName: "mintAudit",
        args: [auditData.to, auditData.auditedContract, BigInt(auditData.chainId), auditData.score, auditData.cid],
      });
      onClose();
    } catch (e) {
      console.error("Error generating NFT:", e);
    }
  };

  return (
    <div className="flex flex-col items-center">
      <div className="w-full h-48 bg-gradient-to-br from-emerald-500 to-emerald-700 flex flex-col items-center justify-center text-white rounded-md mb-4">
        <span className="text-lg font-bold">SecureChain</span>
        <span className="text-sm">Proof-of-Audit NFT</span>
        <span className="mt-2 font-mono text-xs">{auditData.auditedContract}</span>
        <span className="mt-1">Score: {auditData.score}</span>
        <span className="mt-1 text-xs">CID: {auditData.cid}</span>
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-300 text-center mb-4">
        This NFT will be issued as proof of the audit on the blockchain.
      </p>
      <div className="flex gap-3">
        <button
          onClick={onClose}
          className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-md text-sm text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600"
        >
          Cancel
        </button>
        <button
          onClick={handleMint}
          disabled={isMining}
          className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-md text-sm"
        >
          {isMining ? "Generating..." : "Confirm"}
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

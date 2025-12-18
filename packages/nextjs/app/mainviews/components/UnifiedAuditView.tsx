"use client";

import { useState, useEffect } from "react";
import { toPng } from "html-to-image";
import { QRCodeSVG } from "qrcode.react";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { useAccount, usePublicClient } from "wagmi";
import type { ChatCompletionMessageParam } from "groq-sdk/resources/chat/completions";

/**
 * Unified Audit View Component
 *
 * Automatically runs AI analysis on load, simulates IPFS upload, and includes chatbot.
 */
export default function UnifiedAuditView({ contractAddress }: { contractAddress: string }) {
    const { address: connectedAddress } = useAccount();
    const publicClient = usePublicClient();

    // Analysis state
    const [loading, setLoading] = useState(true);
    const [analysis, setAnalysis] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    // IPFS simulation state
    const [ipfsUploading, setIpfsUploading] = useState(false);
    const [ipfsCid, setIpfsCid] = useState("");

    // Modal state
    const [showNFTModal, setShowNFTModal] = useState(false);
    const [showQRModal, setShowQRModal] = useState(false);

    // Chatbot state
    const [showChat, setShowChat] = useState(false);
    const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
    const [input, setInput] = useState("");
    const [chatLoading, setChatLoading] = useState(false);

    /**
     * Auto-run analysis on component mount
     */
    useEffect(() => {
        runAnalysis();
    }, [contractAddress]);

    /**
     * Fetch bytecode and run AI analysis
     */
    const runAnalysis = async () => {
        setLoading(true);
        setError(null);

        try {
            let bytecode: string | undefined;

            // Try to fetch bytecode from blockchain
            if (publicClient) {
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

            // Simulate IPFS upload automatically
            await simulateIPFSUpload(data.analysis);
        } catch (e: any) {
            console.error("Error in analysis:", e);
            setError(e?.message || "Unknown error");
        } finally {
            setLoading(false);
        }
    };

    /**
     * Simulate IPFS upload (for demo purposes)
     */
    const simulateIPFSUpload = async (analysisData: any) => {
        setIpfsUploading(true);
        // Simulate upload delay
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Generate a realistic-looking IPFS CID
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substring(2, 15);
        const generatedCid = `Qm${timestamp}${random}`;

        setIpfsCid(generatedCid);
        setIpfsUploading(false);
    };

    /**
     * Send message to chatbot
     */
    const sendMessage = async () => {
        if (!input.trim()) return;

        const newMessages = [...messages, { role: "user", content: input }];
        setMessages(newMessages);
        setInput("");
        setChatLoading(true);

        try {
            const testContract = `
// Contract being audited: ${contractAddress}
// Analysis Score: ${analysis?.score || "N/A"}
// Summary: ${analysis?.summary || "No analysis available"}
      `;

            const contextMessages: ChatCompletionMessageParam[] = [
                {
                    role: "system",
                    content:
                        "You are an expert smart contract auditor. " +
                        "Answer questions about the audited contract clearly and concisely. " +
                        "This is the contract context:\\n" +
                        testContract,
                },
                ...newMessages.map(m => ({
                    role: m.role as "user" | "assistant" | "system",
                    content: m.content,
                })),
            ];

            const res = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ messages: contextMessages }),
            });

            const data = await res.json();
            setMessages([...newMessages, { role: "assistant", content: data.reply }]);
        } catch (err) {
            console.error("Error in chat:", err);
            setMessages(prev => [...prev, { role: "assistant", content: "Error processing the request." }]);
        } finally {
            setChatLoading(false);
        }
    };

    /**
     * Downloads the QR code as a PNG image
     */
    const handleDownloadQR = async () => {
        const node = document.getElementById("qr-container");
        if (!node) return;
        const dataUrl = await toPng(node);
        const link = document.createElement("a");
        link.download = `securechain-audit-${contractAddress}.png`;
        link.href = dataUrl;
        link.click();
    };

    // QR value points to this audit page
    const qrValue = `${typeof window !== "undefined" ? window.location.origin : "https://securechain.app"}/mainviews?address=${contractAddress}`;

    // Loading state
    if (loading) {
        return (
            <div className="w-full max-w-4xl mx-auto p-6">
                <div className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-400">Analyzing contract...</p>
                    {ipfsUploading && <p className="text-sm text-gray-500 mt-2">Uploading report to IPFS...</p>}
                </div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="w-full max-w-4xl mx-auto p-6">
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-red-900 dark:text-red-100 mb-2">Analysis Error</h3>
                    <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
                    <button
                        onClick={runAnalysis}
                        className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm"
                    >
                        Retry Analysis
                    </button>
                </div>
            </div>
        );
    }

    if (!analysis) return null;

    const score = analysis.score || 0;
    const riskLevel = score >= 80 ? "low" : score >= 50 ? "medium" : "high";

    return (
        <div className="w-full max-w-4xl mx-auto p-6 space-y-6">
            {/* Demo Disclaimer */}
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <div className="flex items-start gap-2">
                    <span className="text-yellow-600 dark:text-yellow-400 text-lg">ℹ️</span>
                    <div>
                        <h4 className="font-semibold text-yellow-900 dark:text-yellow-100 text-sm mb-1">Demo Mode</h4>
                        <p className="text-xs text-yellow-800 dark:text-yellow-200">
                            This is a demonstration for the Aleph Hackathon. Analysis results are generated for testing purposes and
                            should not be considered as real security audits. IPFS upload is simulated.
                        </p>
                    </div>
                </div>
            </div>

            {/* Score Card */}
            <div
                className={`rounded-xl p-6 shadow-sm border text-center ${riskLevel === "low"
                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800"
                    : riskLevel === "medium"
                        ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 border-yellow-200 dark:border-yellow-800"
                        : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 border-red-200 dark:border-red-800"
                    }`}
            >
                <h2 className="text-sm uppercase tracking-wide font-medium">Security Score</h2>
                <p className="text-5xl font-bold mt-2">{score}</p>
                <span className="block mt-1 text-lg font-semibold">
                    {riskLevel === "low" && "✅ SAFE"}
                    {riskLevel === "medium" && "⚠️ WARNING"}
                    {riskLevel === "high" && "🚨 DANGEROUS"}
                </span>
            </div>

            {/* Summary */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-3">AI Analysis Summary</h3>
                <p className="text-sm text-gray-700 dark:text-gray-300">{analysis.summary}</p>
            </div>

            {/* Risks */}
            {analysis.risks && analysis.risks.length > 0 && (
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
                    <h3 className="text-lg font-semibold mb-3">Identified Risks</h3>
                    <ul className="space-y-3">
                        {analysis.risks.map((risk: any, i: number) => (
                            <li key={i} className="border-l-4 border-gray-300 dark:border-gray-600 pl-4">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="font-semibold text-sm">{risk.title}</span>
                                    <span
                                        className={`text-xs px-2 py-0.5 rounded ${risk.severity === "high"
                                            ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                                            : risk.severity === "medium"
                                                ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                                                : "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200"
                                            }`}
                                    >
                                        {risk.severity.toUpperCase()}
                                    </span>
                                </div>
                                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">{risk.details}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-500">
                                    <strong>Mitigation:</strong> {risk.mitigation}
                                </p>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Recommendations */}
            {analysis.recommendations && analysis.recommendations.length > 0 && (
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
                    <h3 className="text-lg font-semibold mb-3">Recommendations</h3>
                    <ul className="list-disc list-inside space-y-1">
                        {analysis.recommendations.map((rec: string, i: number) => (
                            <li key={i} className="text-sm text-gray-700 dark:text-gray-300">
                                {rec}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* IPFS Upload Status */}
            {ipfsCid && (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-green-600 dark:text-green-400">✓</span>
                        <h4 className="font-semibold text-green-900 dark:text-green-100">Report Uploaded to IPFS</h4>
                    </div>
                    <p className="text-sm text-green-800 dark:text-green-200 mb-2">
                        Your audit report has been uploaded to IPFS (simulated for demo)
                    </p>
                    <p className="text-xs font-mono text-green-700 dark:text-green-300 break-all">CID: {ipfsCid}</p>
                </div>
            )}

            {/* Action Buttons */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-3">Actions</h3>
                <p className="text-sm text-blue-800 dark:text-blue-200 mb-4">
                    Mint an on-chain certificate, generate a QR code, or ask the AI questions about this audit.
                </p>

                <div className="flex flex-wrap gap-3">
                    <button
                        onClick={() => setShowNFTModal(true)}
                        disabled={!ipfsCid}
                        className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-md text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {ipfsCid ? "Mint Certificate NFT" : "Uploading to IPFS..."}
                    </button>
                    <button
                        onClick={() => setShowQRModal(true)}
                        className="px-4 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md text-sm hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    >
                        Generate QR Code
                    </button>
                    <button
                        onClick={() => setShowChat(true)}
                        className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-md text-sm transition-colors"
                    >
                        💬 Ask AI Questions
                    </button>
                </div>
            </div>

            {/* NFT Modal */}
            <LocalModal open={showNFTModal} onClose={() => setShowNFTModal(false)} title="Mint Audit Certificate NFT">
                <NFTModalContent
                    auditData={{
                        to: connectedAddress || "0x0000000000000000000000000000000000000000",
                        auditedContract: contractAddress,
                        chainId: 11155111,
                        score: score,
                        cid: ipfsCid,
                    }}
                    onClose={() => setShowNFTModal(false)}
                />
            </LocalModal>

            {/* QR Modal */}
            <LocalModal open={showQRModal} onClose={() => setShowQRModal(false)} title="Audit Verification QR Code">
                <div className="flex flex-col items-center">
                    <div id="qr-container" className="bg-white p-4 rounded-md dark:bg-gray-900">
                        <QRCodeSVG value={qrValue} size={200} bgColor="#FFFFFF" fgColor="#000000" level="H" />
                    </div>
                    <p className="mt-4 text-sm text-gray-600 dark:text-gray-300 text-center">
                        Scan this code to view the audit results for this contract
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

            {/* Chatbot Modal */}
            <LocalModal open={showChat} onClose={() => setShowChat(false)} title="Ask AI About This Contract">
                <div className="flex flex-col h-96">
                    {/* Message history */}
                    <div className="flex-1 overflow-y-auto space-y-3 mb-3">
                        {messages.length === 0 && (
                            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
                                Ask me anything about the audited contract...
                            </p>
                        )}
                        {messages.map((m, i) => (
                            <div key={i} className={m.role === "user" ? "text-right" : "text-left"}>
                                <p
                                    className={`inline-block px-3 py-2 rounded-lg text-sm max-w-[80%] ${m.role === "user"
                                        ? "bg-purple-500 text-white"
                                        : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                                        }`}
                                >
                                    {m.content}
                                </p>
                            </div>
                        ))}
                        {chatLoading && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 italic">AI is thinking...</p>
                        )}
                    </div>

                    {/* Input and send button */}
                    <div className="flex gap-2 pt-3 border-t border-gray-200 dark:border-gray-700">
                        <input
                            type="text"
                            placeholder="Type your question..."
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyPress={e => e.key === "Enter" && sendMessage()}
                            className="flex-1 px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                        <button
                            onClick={sendMessage}
                            disabled={chatLoading || !input.trim()}
                            className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Send
                        </button>
                    </div>
                </div>
            </LocalModal>
        </div>
    );
}

/**
 * NFT Modal Content Component
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
            console.error("Error minting NFT:", e);
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
                    <span className="text-sm">
                        Score: <span className="font-bold">{auditData.score}</span>
                    </span>
                    <span className="text-sm">
                        Chain: <span className="font-bold">{auditData.chainId}</span>
                    </span>
                </div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300 text-center mb-2">
                This NFT will be minted as proof of the audit on the blockchain.
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center mb-4">
                IPFS CID: <span className="font-mono">{auditData.cid}</span>
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
                    {isMining ? "Minting..." : "Confirm & Mint"}
                </button>
            </div>
        </div>
    );
}

/**
 * Local Modal Component
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

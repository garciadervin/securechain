"use client";

import { useState } from "react";
import type { NextPage } from "next";

type RiskLevel = "low" | "medium" | "high";
type Tab = "resumen" | "analisis" | "chat";

const Modal = ({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) => {
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
            Cerrar
          </button>
        </div>
        <div className="px-5 py-4">{children}</div>
      </div>
    </div>
  );
};

const ResultsPage: NextPage = () => {
  const [activeTab, setActiveTab] = useState<Tab>("resumen");
  const [showNFTModal, setShowNFTModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);

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
        {activeTab === "resumen" && (
          <>
            <h3 className="text-lg font-semibold mb-2">Datos de la auditoría</h3>
            <ul className="list-disc list-inside space-y-1 mb-4">
              <li>
                <strong>Auditoría para:</strong> <span className="font-mono">{auditData.to}</span>
              </li>
              <li>
                <strong>Contrato auditado:</strong> <span className="font-mono">{auditData.auditedContract}</span>
              </li>
              <li>
                <strong>Chain ID:</strong> {auditData.chainId}
              </li>
              <li>
                <strong>Reporte IPFS:</strong>{" "}
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

            <div className="flex gap-4 mt-6">
              <button
                onClick={() => setShowNFTModal(true)}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md text-sm hover:bg-gray-200 dark:hover:bg-gray-700"
              >
                Generar NFT de Certificación
              </button>
              <button
                onClick={() => setShowQRModal(true)}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md text-sm hover:bg-gray-200 dark:hover:bg-gray-700"
              >
                Generar Código QR
              </button>
            </div>
          </>
        )}

        {activeTab === "analisis" && (
          <div>
            <h3 className="text-lg font-semibold mb-2">Análisis Semántico</h3>
            <p className="mb-4">
              Este contrato ha sido evaluado y presenta un puntaje alto de seguridad. Las funciones principales
              gestionan depósitos y retiros con control de acceso adecuado.
            </p>
            <h4 className="font-semibold mb-1">Observaciones</h4>
            <ul className="list-disc list-inside space-y-1">
              <li>No se detectaron patrones de reentrancy.</li>
              <li>Uso correcto de modifiers para control de roles.</li>
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
      {/* Modal NFT */}
      <Modal open={showNFTModal} onClose={() => setShowNFTModal(false)} title="Generar NFT de Certificación">
        <div className="flex flex-col items-center">
          <div className="w-full h-48 bg-gradient-to-br from-emerald-500 to-emerald-700 flex flex-col items-center justify-center text-white rounded-md mb-4">
            <span className="text-lg font-bold">SecureChain</span>
            <span className="text-sm">Proof-of-Audit NFT</span>
            <span className="mt-2 font-mono text-xs">{auditData.auditedContract}</span>
            <span className="mt-1">Score: {auditData.score}</span>
            <span className="mt-1 text-xs">CID: {auditData.cid}</span>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-300 text-center mb-4">
            Este NFT se emitirá como prueba de auditoría en blockchain. Pulsa &quot;Confirmar&quot; para proceder con la
            generación.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => setShowNFTModal(false)}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-md text-sm text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600"
            >
              Cancelar
            </button>
            <button
              onClick={() => {
                // Aquí luego irá la lógica para llamar a mintAudit
                setShowNFTModal(false);
              }}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-md text-sm"
            >
              Confirmar
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal QR */}
      <Modal open={showQRModal} onClose={() => setShowQRModal(false)} title="Generar Código QR de Verificación">
        <div className="flex flex-col items-center">
          <div className="bg-white p-2 rounded-md dark:bg-gray-900">
            <div className="w-40 h-40 bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-500 dark:text-gray-400 text-sm rounded-md">
              QR
            </div>
          </div>
          <p className="mt-3 text-sm text-gray-600 dark:text-gray-300 text-center">
            Este código QR permitirá a cualquiera verificar esta auditoría en SecureChain.
          </p>
          <div className="flex gap-3 mt-4">
            <button
              onClick={() => setShowQRModal(false)}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-md text-sm text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600"
            >
              Cerrar
            </button>
            <button
              onClick={() => {
                // Aquí luego irá la lógica para generar y descargar el QR
                setShowQRModal(false);
              }}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-md text-sm"
            >
              Generar
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ResultsPage;

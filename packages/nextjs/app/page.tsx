"use client";

import { useState } from "react";
import type { NextPage } from "next";
import { useAccount } from "wagmi";
import { MagnifyingGlassIcon, WalletIcon } from "@heroicons/react/24/outline";
import { Address } from "~~/components/scaffold-eth";

const Home: NextPage = () => {
  const { address: connectedAddress } = useAccount();
  const [searchAddress, setSearchAddress] = useState("");

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 flex flex-col items-center px-6">
      {/* Branding */}
      <header className="w-full max-w-3xl pt-16 text-center">
        <h1 className="text-4xl font-bold text-emerald-500 mb-2 tracking-tight">SecureChain</h1>
        <p className="text-gray-600 dark:text-gray-400 text-lg">
          Verifica auditorías de contratos inteligentes registradas en blockchain.
        </p>
      </header>

      {/* Dirección conectada */}
      <div className="mt-10 flex justify-center w-full">
        <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-5 py-4 shadow-sm">
          <WalletIcon className="w-6 h-6 text-emerald-500" />
          <div className="flex flex-col items-center">
            <span className="text-xs text-gray-500 dark:text-gray-400">Dirección conectada</span>
            <span className="font-mono text-sm text-gray-800 dark:text-gray-100">
              <Address address={connectedAddress} />
            </span>
          </div>
        </div>
      </div>

      {/* Campo de búsqueda */}
      <div className="mt-10 flex flex-col sm:flex-row items-center gap-3 w-full max-w-md">
        <input
          type="text"
          placeholder="Introduce la dirección del contrato auditado"
          value={searchAddress}
          onChange={e => setSearchAddress(e.target.value)}
          className="flex-1 px-4 py-2 rounded-md border border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
        />
        <button className="px-5 py-2 rounded-md text-white font-medium bg-emerald-500 hover:bg-emerald-600 transition-colors flex items-center gap-2 text-sm">
          <MagnifyingGlassIcon className="w-4 h-4" />
          Buscar
        </button>
      </div>

      {/* Ejemplos */}
      <section className="mt-8 flex flex-wrap justify-center gap-3 w-full max-w-md">
        {["0x000000000000000000000000000000000000dEaD", "0x1234...abcd"].map(ex => (
          <div
            key={ex}
            className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md px-3 py-2 flex items-center justify-between w-full sm:w-auto"
          >
            <code className="text-xs text-gray-700 dark:text-gray-200">{ex}</code>
            <button className="border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 text-xs px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              Probar
            </button>
          </div>
        ))}
      </section>

      {/* Explicación */}
      <section className="mt-8 max-w-md text-center">
        <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
          SecureChain permite registrar y verificar auditorías de contratos inteligentes como NFTs, incluyendo la
          puntuación de riesgo y un enlace al reporte en IPFS.
        </p>
      </section>

      {/* Footer */}
      <footer className="mt-auto py-8 text-xs text-gray-400 dark:text-gray-500">© 2025 SecureChain</footer>
    </div>
  );
};

export default Home;

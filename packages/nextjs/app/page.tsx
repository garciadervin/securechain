"use client";

import { useState } from "react";
import type { NextPage } from "next";
import { useAccount } from "wagmi";
import { MagnifyingGlassIcon, WalletIcon } from "@heroicons/react/24/outline";
import { Address } from "~~/components/scaffold-eth";
import { useRouter } from "next/navigation";

/**
 * Home Page
 *
 * Landing page for SecureChain.
 * Shows branding, connected wallet address, a search field for audited contracts,
 * example addresses, and a brief explanation of the platform.
 */
const Home: NextPage = () => {
  const { address: connectedAddress } = useAccount();
  const [searchAddress, setSearchAddress] = useState("");
  const router = useRouter();

  /**
   * Navigates to the main views page with the given contract address.
   */
  const handleSearch = (address: string) => {
    if (!address.trim()) return;
    router.push(`/mainviews?address=${encodeURIComponent(address)}`);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 flex flex-col items-center px-6">
      {/* Branding */}
      <header className="w-full max-w-3xl pt-16 text-center">
        <h1 className="text-4xl font-bold text-emerald-500 mb-2 tracking-tight">
          SecureChain
        </h1>
        <p className="text-gray-600 dark:text-gray-400 text-lg">
          Verify smart contract audits registered on the blockchain.
        </p>
      </header>

      {/* Connected address */}
      <div className="mt-8 flex justify-center w-full">
        <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2 shadow-sm text-sm">
          <WalletIcon className="w-5 h-5 text-emerald-500" />
          <div className="flex flex-col leading-tight">
            <span className="text-[10px] text-gray-500 dark:text-gray-400">
              Connected
            </span>
            <span className="font-mono text-xs text-gray-800 dark:text-gray-100 truncate max-w-[140px]">
              <Address address={connectedAddress} />
            </span>
          </div>
        </div>
      </div>

      {/* Search field */}
      <div className="mt-8 flex flex-col sm:flex-row items-center gap-3 w-full max-w-md">
        <input
          type="text"
          placeholder="Enter the audited contract address"
          value={searchAddress}
          onChange={(e) => setSearchAddress(e.target.value)}
          className="flex-1 px-3 py-2 rounded-md border border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm shadow-sm"
        />
        <button
          onClick={() => handleSearch(searchAddress)}
          className="px-4 py-2 rounded-md text-white font-medium bg-emerald-500 hover:bg-emerald-600 transition-colors flex items-center gap-2 text-sm shadow-sm cursor-pointer"
        >
          <MagnifyingGlassIcon className="w-4 h-4" />
          Search
        </button>
      </div>

      {/* Example addresses */}
      <section className="mt-8 flex flex-wrap justify-center gap-3 w-full max-w-md">
        {["0x000000000000000000000000000000000000dEaD", "0x1234...abcd"].map(
          (ex) => (
            <div
              key={ex}
              className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md px-3 py-2 flex items-center justify-between w-full sm:w-[280px] shadow-sm"
            >
              <code className="text-xs font-mono text-gray-700 dark:text-gray-200 truncate">
                {ex}
              </code>
              <button
                onClick={() => handleSearch(ex)}
                className="border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 text-xs px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
              >
                Try
              </button>
            </div>
          )
        )}
      </section>

      {/* Explanation */}
      <section className="mt-8 max-w-md text-center">
        <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
          SecureChain allows you to register and verify smart contract audits
          as NFTs, including the risk score and a link to the report on IPFS.
        </p>
      </section>

      {/* Footer */}
      <footer className="mt-auto py-8 text-xs text-gray-400 dark:text-gray-500">
        © {new Date().getFullYear()} SecureChain
      </footer>
    </div>
  );
};

export default Home;
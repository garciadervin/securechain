/**
 * Input type for fetching a contract source.
 * - "address": fetch by blockchain address and chain ID
 * - "ipfs": fetch by IPFS CID
 */
export type SourceFetchInput = { kind: "address"; address: string; chainId: number } | { kind: "ipfs"; cid: string };

/**
 * Output type for a fetched source.
 * - ok: true → source found
 * - ok: false → error message
 */
export type FetchedSource =
  | {
      ok: true;
      source: string;
      origin: "sourcify" | "ipfs" | "bytecode";
      files?: Record<string, string>;
    }
  | { ok: false; error: string };

/**
 * Normalizes an Ethereum address to lowercase.
 */
const normalizeAddress = (addr: string) => addr.toLowerCase();

/**
 * Fetches a contract source from IPFS, Sourcify, or directly from bytecode via RPC.
 */
export async function fetchSource(input: SourceFetchInput): Promise<FetchedSource> {
  try {
    // Fetch from IPFS
    if (input.kind === "ipfs") {
      const txt = await fetchFromIPFS(input.cid);
      return txt ? { ok: true, source: txt, origin: "ipfs" } : { ok: false, error: "Unable to read IPFS CID" };
    }

    // Fetch by address
    const address = normalizeAddress(input.address);
    const { chainId } = input;

    // 1) Try Sourcify
    const sourcify = await fetchSourcify(chainId, address);
    if (sourcify) {
      return {
        ok: true,
        source: sourcify.bundle,
        origin: "sourcify",
        files: sourcify.files,
      };
    }

    // 2) Try fetching bytecode via RPC
    const bytecode = await fetchBytecode(chainId, address);
    if (bytecode) {
      return { ok: true, source: bytecode, origin: "bytecode" };
    }

    return { ok: false, error: "No source or bytecode found" };
  } catch (e: any) {
    return { ok: false, error: e?.message || "Unknown error" };
  }
}

/* ---------- Helpers ---------- */

/**
 * Attempts to fetch verified source files from Sourcify.
 */
async function fetchSourcify(chainId: number, address: string) {
  for (const bucket of ["full_match", "partial_match"] as const) {
    const base = "https://repo.sourcify.dev/contracts";
    const listUrl = `${base}/${bucket}/${chainId}/${address}/`;
    const list = await fetch(listUrl);
    if (!list.ok) continue;

    const filesResp = await fetch(`${base}/${bucket}/${chainId}/${address}/sources/`);
    if (!filesResp.ok) continue;

    const index = await filesResp.json().catch(() => null);
    const files: Record<string, string> = {};
    let bundle = "";

    if (index && Array.isArray(index.files)) {
      for (const f of index.files as { name: string; content?: string }[]) {
        if (f.content) {
          files[f.name] = f.content;
          bundle += `\n\n// -------- ${f.name} --------\n${f.content}`;
        } else {
          const fileUrl = `${base}/${bucket}/${chainId}/${address}/sources/${f.name}`;
          const fileTxt = await fetch(fileUrl).then(r => (r.ok ? r.text() : ""));
          if (fileTxt) {
            files[f.name] = fileTxt;
            bundle += `\n\n// -------- ${f.name} --------\n${fileTxt}`;
          }
        }
      }
      if (bundle.trim()) return { files, bundle };
    }
  }
  return null;
}

/**
 * Fetches the deployed bytecode for a contract via RPC.
 */
async function fetchBytecode(chainId: number, address: string) {
  const rpc = rpcFor(chainId);
  if (!rpc) return null;

  const res = await fetch(rpc, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      id: 1,
      jsonrpc: "2.0",
      method: "eth_getCode",
      params: [address, "latest"],
    }),
  });

  const data = await res.json().catch(() => null);
  const code = data?.result;
  return code && code !== "0x" ? code : null;
}

/**
 * Returns the RPC endpoint for a given chain ID.
 * Uses environment variables for configuration.
 */
function rpcFor(chainId: number) {
  switch (chainId) {
    case 1:
      return process.env.RPC_ETH_MAINNET;
    case 137:
      return process.env.RPC_POLYGON;
    case 8453:
      return process.env.RPC_BASE;
    case 10:
      return process.env.RPC_OPTIMISM;
    case 42161:
      return process.env.RPC_ARBITRUM;
    default:
      return process.env.RPC_ETH_MAINNET;
  }
}

/**
 * Attempts to fetch a file from IPFS using multiple gateways.
 */
async function fetchFromIPFS(cid: string) {
  const gateways = [`https://ipfs.io/ipfs/${cid}`, `https://cloudflare-ipfs.com/ipfs/${cid}`];
  for (const url of gateways) {
    try {
      const r = await fetch(url);
      if (r.ok) return await r.text();
    } catch {
      // Ignore and try next gateway
    }
  }
  return null;
}

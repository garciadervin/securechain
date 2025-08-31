export type SourceFetchInput =
  | { kind: "address"; address: string; chainId: number }
  | { kind: "ipfs"; cid: string };

export type FetchedSource =
  | { ok: true; source: string; origin: "sourcify" | "ipfs" | "bytecode"; files?: Record<string, string> }
  | { ok: false; error: string };

const normalizeAddress = (addr: string) => addr.toLowerCase();

export async function fetchSource(input: SourceFetchInput): Promise<FetchedSource> {
  try {
    if (input.kind === "ipfs") {
      const txt = await fetchFromIPFS(input.cid);
      return txt
        ? { ok: true, source: txt, origin: "ipfs" }
        : { ok: false, error: "No se pudo leer el CID de IPFS" };
    }

    const address = normalizeAddress(input.address);
    const { chainId } = input;

    // 1) Sourcify
    const sourcify = await fetchSourcify(chainId, address);
    if (sourcify) return { ok: true, source: sourcify.bundle, origin: "sourcify", files: sourcify.files };

    // 2) Bytecode por RPC
    const bytecode = await fetchBytecode(chainId, address);
    if (bytecode) return { ok: true, source: bytecode, origin: "bytecode" };

    return { ok: false, error: "No se encontró source ni bytecode" };
  } catch (e: any) {
    return { ok: false, error: e?.message || "Error desconocido" };
  }
}

/* ---------- Helpers ---------- */

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

function rpcFor(chainId: number) {
  // Usa RPC públicos o de tu .env
  switch (chainId) {
    case 1: return process.env.RPC_ETH_MAINNET;
    case 137: return process.env.RPC_POLYGON;
    case 8453: return process.env.RPC_BASE;
    case 10: return process.env.RPC_OPTIMISM;
    case 42161: return process.env.RPC_ARBITRUM;
    default: return process.env.RPC_ETH_MAINNET;
  }
}

async function fetchFromIPFS(cid: string) {
  const gateways = [
    `https://ipfs.io/ipfs/${cid}`,
    `https://cloudflare-ipfs.com/ipfs/${cid}`
  ];
  for (const url of gateways) {
    try {
      const r = await fetch(url);
      if (r.ok) return await r.text();
    } catch {}
  }
  return null;
}
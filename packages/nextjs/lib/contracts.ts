export type SourceFetchInput = { kind: "address"; address: string; chainId: number } | { kind: "ipfs"; cid: string };

export type FetchedSource =
  | { ok: true; source: string; origin: "sourcify" | "etherscan" | "ipfs" | "bytecode"; files?: Record<string, string> }
  | { ok: false; error: string };

const normalizeAddress = (addr: string) => addr.toLowerCase();

export async function fetchSource(input: SourceFetchInput): Promise<FetchedSource> {
  try {
    if (input.kind === "ipfs") {
      const txt = await fetchFromIPFS(input.cid);
      if (!txt) return { ok: false, error: "No se pudo leer el CID de IPFS" };
      return { ok: true, source: txt, origin: "ipfs" };
    }

    const address = normalizeAddress(input.address);
    const { chainId } = input;

    // 1) Sourcify (sin API key)
    const sourcify = await fetchSourcify(chainId, address);
    if (sourcify) return { ok: true, source: sourcify.bundle, origin: "sourcify", files: sourcify.files };

    // 2) Explorador tipo *scan (requiere API key por red)
    const scan = await fetchFromScan(chainId, address);
    if (scan) return { ok: true, source: scan, origin: "etherscan" };

    // 3) Fallback: leer bytecode (no ideal para IA, pero sirve de señal)
    const bytecode = await fetchBytecode(chainId, address);
    if (bytecode) return { ok: true, source: bytecode, origin: "bytecode" };

    return { ok: false, error: "No se encontró source ni bytecode" };
  } catch (e: any) {
    return { ok: false, error: e?.message || "Error desconocido" };
  }
}

/* ---------- Helpers ---------- */

async function fetchSourcify(chainId: number, address: string) {
  // full_match primero, luego partial_match
  for (const bucket of ["full_match", "partial_match"] as const) {
    const base = "https://repo.sourcify.dev/contracts";
    const listUrl = `${base}/${bucket}/${chainId}/${address}/`;
    const list = await fetch(listUrl);
    if (!list.ok) continue;

    // Intentar construir un bundle concatenado a partir de los archivos de source
    const filesResp = await fetch(`${base}/${bucket}/${chainId}/${address}/sources/`);
    if (!filesResp.ok) continue;
    const index = await filesResp.json().catch(() => null);
    const files: Record<string, string> = {};
    let bundle = "";

    if (index && Array.isArray(index.files)) {
      for (const f of index.files as { name: string; content?: string }[]) {
        // Algunos endpoints devuelven la lista; otros requieren pedir archivo por archivo
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

async function fetchFromScan(chainId: number, address: string) {
  const key = scanKeyFor(chainId);
  if (!key) return null;

  const { apiBase } = scanEndpointFor(chainId);
  const url = `${apiBase}?module=contract&action=getsourcecode&address=${address}&apikey=${key}`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const data = await res.json().catch(() => null);
  const item = data?.result?.[0];
  const source = item?.SourceCode;
  if (!source) return null;

  // Algunos explorers devuelven JSON con múltiples files; otros 1 archivo
  if (source.startsWith("{") || source.startsWith("[")) {
    try {
      const parsed = JSON.parse(source);
      if (parsed?.sources) {
        let bundle = "";
        for (const [name, v] of Object.entries<any>(parsed.sources)) {
          bundle += `\n\n// -------- ${name} --------\n${v.content || ""}`;
        }
        return bundle;
      }
    } catch {
      // cae a devolver el raw
    }
  }
  return source as string;
}

function scanEndpointFor(chainId: number) {
  switch (chainId) {
    case 1:
      return { apiBase: "https://api.etherscan.io/api" };
    case 137:
      return { apiBase: "https://api.polygonscan.com/api" };
    case 8453:
      return { apiBase: "https://api.basescan.org/api" };
    case 10:
      return { apiBase: "https://api-optimistic.etherscan.io/api" };
    case 42161:
      return { apiBase: "https://api.arbiscan.io/api" };
    default:
      return { apiBase: "https://api.etherscan.io/api" };
  }
}

function scanKeyFor(chainId: number) {
  switch (chainId) {
    case 1:
      return process.env.ETHERSCAN_API_KEY;
    case 137:
      return process.env.POLYGONSCAN_API_KEY;
    case 8453:
      return process.env.BASESCAN_API_KEY;
    case 10:
      return process.env.OPTIMISTICSCAN_API_KEY;
    case 42161:
      return process.env.ARBISCAN_API_KEY;
    default:
      return process.env.ETHERSCAN_API_KEY;
  }
}

async function fetchBytecode(chainId: number, address: string) {
  // Usa un RPC público o tu RPC (mejor en .env)
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
  if (code && code !== "0x") return code as string;
  return null;
}

function rpcFor(chainId: number) {
  // Configura tus RPC en .env.local
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

/* IPFS helper (importa de /lib/ipfs) */
async function fetchFromIPFS(cid: string) {
  const gateways = [`https://ipfs.io/ipfs/${cid}`, `https://cloudflare-ipfs.com/ipfs/${cid}`];
  for (const url of gateways) {
    try {
      const r = await fetch(url);
      if (r.ok) return await r.text();
    } catch {
      // intentar siguiente
    }
  }
  return null;
}

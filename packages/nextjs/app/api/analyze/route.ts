import { NextResponse } from "next/server";
import { type SourceFetchInput, fetchSource } from "../../../lib/contracts";
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export const maxDuration = 60; // Next.js (si usas Vercel) — ajusta si necesitas

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const input: SourceFetchInput = body?.ipfsCid
      ? { kind: "ipfs", cid: String(body.ipfsCid) }
      : { kind: "address", address: String(body.address), chainId: Number(body.chainId) };

    // 1) Obtener source
    const got = await fetchSource(input);
    if (!got.ok) {
      return NextResponse.json({ error: got.error }, { status: 400 });
    }

    // 2) Prompt a IA para análisis estructurado
    const system =
      "Eres un auditor experto de contratos Solidity. Devuelves SOLO JSON válido con el siguiente esquema: " +
      `{"score": number (1..100), "summary": string, "risks": [{"title": string, "severity": "low"|"medium"|"high", "details": string, "mitigation": string}], "recommendations": string[]}`;

    const user =
      "Audita el siguiente contrato. Identifica vulnerabilidades, riesgos, severidad y recomendaciones. " +
      "Si el contenido es bytecode o incompleto, indica limitaciones en summary pero intenta inferir riesgos. " +
      "Código:\n" +
      got.source;

    const completion = await groq.chat.completions.create({
      model: "openai/gpt-oss-20b", // o "gpt-oss-120b"
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      temperature: 0.2,
      max_tokens: 1500,
    });

    const raw = completion.choices[0]?.message?.content || "{}";

    // 3) Parse seguro
    let analysis: any;
    try {
      analysis = JSON.parse(raw);
    } catch {
      // Intento simple de extracción de JSON si el modelo devolvió texto adicional
      const m = raw.match(/\{[\s\S]*\}$/);
      analysis = m
        ? JSON.parse(m[0])
        : { summary: "No se pudo parsear respuesta", score: 50, risks: [], recommendations: [] };
    }

    return NextResponse.json({
      origin: got.origin,
      analysis,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Error" }, { status: 500 });
  }
}

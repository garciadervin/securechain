import { NextResponse } from "next/server";
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: Request) {
  try {
    // Contrato de prueba (puedes reemplazarlo por uno real o recibido en el body)
    const testContract = `
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract SimpleStorage {
    uint256 private value;
    function set(uint256 _value) public { value = _value; }
    function get() public view returns (uint256) { return value; }
}
    `;

    // Prompt para la IA
    const systemPrompt =
      "Eres un auditor experto de contratos Solidity. Devuelves SOLO JSON válido con el siguiente esquema: " +
      `{"score": number (1..100), "summary": string, "risks": [{"title": string, "severity": "low"|"medium"|"high", "details": string, "mitigation": string}], "recommendations": string[]}`;

    const userPrompt =
      "Audita el siguiente contrato. Identifica vulnerabilidades, riesgos, severidad y recomendaciones. " +
      "Si el contenido es incompleto, indica limitaciones en summary pero intenta inferir riesgos. " +
      "Código:\n" + testContract;

    // Llamada a Groq
    const completion = await groq.chat.completions.create({
      model: "openai/gpt-oss-20b", // o "gpt-oss-120b"
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.2,
      max_tokens: 1500,
    });

    const raw = completion.choices[0]?.message?.content || "{}";

    // Parse seguro
    let analysis;
    try {
      analysis = JSON.parse(raw);
    } catch {
      const match = raw.match(/\{[\s\S]*\}$/);
      analysis = match
        ? JSON.parse(match[0])
        : { summary: "No se pudo parsear respuesta", score: 50, risks: [], recommendations: [] };
    }

    return NextResponse.json({ analysis });
  } catch (e: any) {
    console.error("Error en /api/analyze:", e);
    return NextResponse.json({ error: e?.message || "Error desconocido" }, { status: 500 });
  }
}
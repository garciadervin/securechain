import { NextResponse } from "next/server";
import Groq from "groq-sdk";
import type { ChatCompletionMessageParam } from "groq-sdk/resources/chat/completions";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: Request) {
  try {
    const { messages: userMessages } = await req.json();

    const testContract = `
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract SimpleStorage {
    uint256 private value;
    function set(uint256 _value) public { value = _value; }
    function get() public view returns (uint256) { return value; }
}
    `;

    const messages: ChatCompletionMessageParam[] = [
      {
        role: "system",
        content:
          "Eres un auditor experto de contratos Solidity. Responde siempre en texto plano, usando saltos de línea para separar ideas. " +
          "No uses tablas, listas con viñetas, ni ningún formato especial como Markdown. " +
          "Este es el contrato de referencia:\n" + testContract
      },
      ...(userMessages || [])
    ];

    const completion = await groq.chat.completions.create({
      model: "openai/gpt-oss-20b",
      messages,
      temperature: 0.7,
      max_tokens: 800,
    });

    return NextResponse.json({
      reply: (completion.choices[0]?.message?.content || "").trim()
    });

  } catch (error) {
    console.error("Error en API Chat:", error);
    return NextResponse.json({ reply: "Error al procesar la solicitud." }, { status: 500 });
  }
}
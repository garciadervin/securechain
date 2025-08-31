import { NextResponse } from "next/server";
import Groq from "groq-sdk";

/**
 * Initialize Groq client with API key from environment variables.
 * Make sure GROQ_API_KEY is set in your environment.
 */
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

/**
 * POST /api/analyze
 *
 * This endpoint sends a Solidity smart contract to the Groq LLM for security auditing.
 * The model is instructed to return ONLY valid JSON matching a predefined schema.
 * The response is parsed and returned to the client.
 */
export async function POST(_req: Request) {
  try {
    /**
     * Example Solidity contract.
     * In production, replace this with a contract received in the request body.
     */
    const testContract = `
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract SimpleStorage {
    uint256 private value;
    function set(uint256 _value) public { value = _value; }
    function get() public view returns (uint256) { return value; }
}
    `;

    /**
     * System prompt: instructs the model to act as an expert Solidity auditor
     * and return ONLY valid JSON matching the expected schema.
     */
    const systemPrompt =
      "You are an expert Solidity smart contract auditor. " +
      "Return ONLY valid JSON matching the following schema: " +
      `{"score": number (1..100), "summary": string, "risks": [{"title": string, "severity": "low"|"medium"|"high", "details": string, "mitigation": string}], "recommendations": string[]}`;

    /**
     * User prompt: provides the contract code and asks for vulnerabilities,
     * risk assessment, severity levels, and recommendations.
     */
    const userPrompt =
      "Audit the following contract. Identify vulnerabilities, risks, severity, and recommendations. " +
      "If the content is incomplete, mention limitations in the summary but try to infer potential risks. " +
      "Code:\n" +
      testContract;

    /**
     * Call the Groq API to generate the audit.
     */
    const completion = await groq.chat.completions.create({
      model: "openai/gpt-oss-20b", // Alternative: "gpt-oss-120b"
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.2,
      max_tokens: 1500,
    });

    const raw = completion.choices[0]?.message?.content || "{}";

    /**
     * Attempt to parse the model's response as JSON.
     * If parsing fails, try to extract the last JSON object from the text.
     * If that also fails, return a default object with an error message.
     */
    let analysis;
    try {
      analysis = JSON.parse(raw);
    } catch {
      const match = raw.match(/\{[\s\S]*\}$/);
      analysis = match
        ? JSON.parse(match[0])
        : {
            summary: "Unable to parse model response",
            score: 50,
            risks: [],
            recommendations: [],
          };
    }

    return NextResponse.json({ analysis });
  } catch (e: any) {
    console.error("Error in /api/analyze:", e);
    return NextResponse.json({ error: e?.message || "Unknown error" }, { status: 500 });
  }
}

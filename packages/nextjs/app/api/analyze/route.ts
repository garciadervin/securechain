import { NextResponse } from "next/server";
import Groq from "groq-sdk";

/**
 * POST /api/analyze
 *
 * This endpoint sends a Solidity smart contract to the Groq LLM for security auditing.
 * The model is instructed to return ONLY valid JSON matching a predefined schema.
 * The response is parsed and returned to the client.
 * 
 * If GROQ_API_KEY is not set, returns demo data for hackathon presentation.
 */
export async function POST(_req: Request) {
  // Check if API key is configured
  if (!process.env.GROQ_API_KEY) {
    console.warn("GROQ_API_KEY not configured, returning demo data");
    return NextResponse.json({
      analysis: {
        score: 75,
        summary:
          "Demo mode: GROQ_API_KEY not configured. This is sample analysis data. " +
          "The contract appears to have basic functionality with moderate security considerations. " +
          "To get real AI-powered analysis, please configure GROQ_API_KEY in your .env.local file.",
        risks: [
          {
            title: "Configuration Required",
            severity: "medium" as const,
            details: "GROQ_API_KEY environment variable is not set. Real AI analysis is unavailable.",
            mitigation: "Add GROQ_API_KEY to .env.local file. Get your key from https://console.groq.com",
          },
          {
            title: "Demo Data",
            severity: "low" as const,
            details: "This is sample data for demonstration purposes only.",
            mitigation: "Configure the API key to enable real smart contract analysis.",
          },
        ],
        recommendations: [
          "Configure GROQ_API_KEY for real AI-powered analysis",
          "Review the contract manually for security vulnerabilities",
          "Consider professional audit services for production contracts",
        ],
      },
    });
  }

  try {
    /**
     * Initialize Groq client with API key from environment variables.
     */
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
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
     * If parsing fails, try to extract JSON from the text.
     * If that also fails, return a default object with an error message.
     */
    let analysis;
    try {
      analysis = JSON.parse(raw);
    } catch {
      // Try to find JSON object in the response
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          // Clean up any trailing commas or invalid JSON
          const cleaned = jsonMatch[0]
            .replace(/,(\s*[}\]])/g, "$1") // Remove trailing commas
            .replace(/[\u0000-\u001F]+/g, ""); // Remove control characters
          analysis = JSON.parse(cleaned);
        } catch (e) {
          console.error("Failed to parse cleaned JSON:", e);
          analysis = {
            summary: "Unable to parse AI response. Using default analysis.",
            score: 50,
            risks: [
              {
                title: "Analysis Error",
                severity: "medium",
                details: "The AI response could not be parsed correctly.",
                mitigation: "Try running the analysis again.",
              },
            ],
            recommendations: ["Retry the analysis", "Check API configuration"],
          };
        }
      } else {
        analysis = {
          summary: "No valid JSON found in AI response.",
          score: 50,
          risks: [],
          recommendations: ["Retry the analysis"],
        };
      }
    }

    return NextResponse.json({ analysis });
  } catch (e: any) {
    console.error("Error in /api/analyze:", e);
    return NextResponse.json({ error: e?.message || "Unknown error" }, { status: 500 });
  }
}

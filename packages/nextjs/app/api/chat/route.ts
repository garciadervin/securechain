import { NextResponse } from "next/server";
import Groq from "groq-sdk";
import type { ChatCompletionMessageParam } from "groq-sdk/resources/chat/completions";

/**
 * Initialize Groq client with API key from environment variables.
 * Make sure GROQ_API_KEY is set in your environment.
 */
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

/**
 * POST /api/chat
 *
 * This endpoint sends a conversation (including a reference Solidity contract)
 * to the Groq LLM for plain‑text auditing feedback.
 * The system prompt enforces plain text output with line breaks, no tables,
 * no bullet points, and no Markdown formatting.
 */
export async function POST(req: Request) {
  try {
    // Extract user messages from the request body
    const { messages: userMessages } = await req.json();

    /**
     * Example Solidity contract.
     * In production, replace this with a contract received in the request body
     * or from another source.
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
     * Build the conversation array for the model.
     * The system prompt instructs the model to act as an expert Solidity auditor
     * and to respond in plain text only.
     */
    const messages: ChatCompletionMessageParam[] = [
      {
        role: "system",
        content:
          "You are an expert Solidity smart contract auditor. Always respond in plain text, " +
          "using line breaks to separate ideas. Do not use tables, bullet points, " +
          "or any special formatting such as Markdown. " +
          "Here is the reference contract:\n" +
          testContract,
      },
      ...(userMessages || []),
    ];

    /**
     * Call the Groq API to generate the audit response.
     */
    const completion = await groq.chat.completions.create({
      model: "openai/gpt-oss-20b", // Alternative: "gpt-oss-120b"
      messages,
      temperature: 0.7,
      max_tokens: 800,
    });

    // Extract and trim the model's reply
    const reply = (completion.choices[0]?.message?.content || "").trim();

    return NextResponse.json({ reply });
  } catch (error) {
    console.error("Error in /api/chat:", error);
    return NextResponse.json({ reply: "Error processing the request." }, { status: 500 });
  }
}

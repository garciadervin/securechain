"use client";
import { useState } from "react";
import type { ChatCompletionMessageParam } from "groq-sdk/resources/chat/completions";

/**
 * ChatbotTab Component
 *
 * This component renders a simple chat interface for interacting with the `/api/chat` endpoint.
 * It always injects a reference Solidity contract into the conversation as context for the model.
 */
export default function ChatbotTab() {
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  /**
   * Sends the current user input to the backend API along with the conversation history.
   * A reference Solidity contract is always included as the first system message.
   */
  const sendMessage = async () => {
    if (!input.trim()) return;

    // Append the new user message to the conversation
    const newMessages = [...messages, { role: "user", content: input }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      // Reference Solidity contract sent as context in every request
      const testContract = `
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract SimpleStorage {
    uint256 private value;
    function set(uint256 _value) public { value = _value; }
    function get() public view returns (uint256) { return value; }
}
      `;

      // Build the message array for the API call
      const contextMessages: ChatCompletionMessageParam[] = [
        {
          role: "system",
          content:
            "You are an expert smart contract auditor. " +
            "Explain clearly and in a friendly manner. " +
            "This is the reference contract for all responses:\n" +
            testContract,
        },
        ...newMessages.map(m => ({
          role: m.role as "user" | "assistant" | "system",
          content: m.content,
        })),
      ];

      // Send the conversation to the backend
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: contextMessages }),
      });

      const data = await res.json();

      // Append the assistant's reply to the conversation
      setMessages([...newMessages, { role: "assistant", content: data.reply }]);
    } catch (err) {
      console.error("Error in ChatbotTab:", err);
      setMessages(prev => [...prev, { role: "assistant", content: "Error processing the request." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-96 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      {/* Message history */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3">
        {messages.map((m, i) => (
          <div key={i} className={m.role === "user" ? "text-right" : "text-left"}>
            <p
              className={`inline-block px-3 py-2 rounded-lg text-sm ${m.role === "user"
                  ? "bg-emerald-500 text-white"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                }`}
            >
              {m.content}
            </p>
          </div>
        ))}
        {loading && <p className="text-xs text-gray-500">Typing...</p>}
      </div>

      {/* Input and send button */}
      <div className="p-3 border-t border-gray-200 dark:border-gray-700 flex gap-2">
        <input
          type="text"
          placeholder="Type your question..."
          value={input}
          onChange={e => setInput(e.target.value)}
          className="flex-1 px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm"
        />
        <button
          onClick={sendMessage}
          disabled={loading}
          className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-md text-sm"
        >
          Send
        </button>
      </div>
    </div>
  );
}

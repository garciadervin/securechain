//"use client";
import { useState } from "react";
import type { ChatCompletionMessageParam } from "groq-sdk/resources/chat/completions";

/**
 * Chatbot Component
 *
 * This component provides a simple chat interface for interacting with the `/api/chat` endpoint.
 * It always injects a reference Solidity contract into the conversation as context for the model.
 */
export default function Chatbot() {
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
            "You are an expert Solidity smart contract auditor. " +
            "The following contract is your base context for answering any user question:\n" +
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
      setMessages(prev => [...prev, { role: "assistant", content: data.reply }]);
    } catch (err) {
      console.error("Error sending message:", err);
      setMessages(prev => [...prev, { role: "assistant", content: "Error processing the request." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full border rounded-lg overflow-hidden">
      {/* Chat messages */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
              m.role === "user"
                ? "bg-emerald-500 text-white self-end ml-auto"
                : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 self-start"
            }`}
          >
            {m.content}
          </div>
        ))}
        {loading && <p className="text-xs text-gray-500">Typing...</p>}
      </div>

      {/* Input area */}
      <div className="flex gap-2 border-t p-3">
        <input
          type="text"
          placeholder="Type your question..."
          value={input}
          onChange={e => setInput(e.target.value)}
          className="flex-1 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
        />
        <button
          onClick={sendMessage}
          disabled={loading}
          className="rounded-md bg-emerald-500 px-4 py-2 text-sm text-white hover:bg-emerald-600"
        >
          Send
        </button>
      </div>
    </div>
  );
}

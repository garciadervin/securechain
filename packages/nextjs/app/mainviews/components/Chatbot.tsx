"use client";

import { useState } from "react";
import type { ChatCompletionMessageParam } from "groq-sdk/resources/chat/completions";

export default function Chatbot() {
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const newMessages = [...messages, { role: "user", content: input }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      // Contrato de prueba que siempre se envía como contexto
      const testContract = `
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract SimpleStorage {
    uint256 private value;
    function set(uint256 _value) public { value = _value; }
    function get() public view returns (uint256) { return value; }
}
      `;

      // Inyectamos el contexto del contrato como primer mensaje del sistema
      const contextMessages: ChatCompletionMessageParam[] = [
        {
          role: "system",
          content:
            "Eres un auditor experto de contratos Solidity. El siguiente contrato es tu contexto base para responder cualquier pregunta del usuario:\n" +
            testContract
        },
        ...newMessages.map(m => ({
          role: m.role as "user" | "assistant" | "system",
          content: m.content
        }))
      ];

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: contextMessages }),
      });

      const data = await res.json();
      setMessages(prev => [...prev, { role: "assistant", content: data.reply }]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: "assistant", content: "Error al procesar la solicitud." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full border rounded-lg overflow-hidden">
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
        {loading && <p className="text-xs text-gray-500">Escribiendo...</p>}
      </div>
      <div className="flex gap-2 border-t p-3">
        <input
          type="text"
          placeholder="Escribe tu pregunta..."
          value={input}
          onChange={e => setInput(e.target.value)}
          className="flex-1 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
        />
        <button
          onClick={sendMessage}
          disabled={loading}
          className="rounded-md bg-emerald-500 px-4 py-2 text-sm text-white hover:bg-emerald-600"
        >
          Enviar
        </button>
      </div>
    </div>
  );
}
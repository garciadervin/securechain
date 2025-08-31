"use client";

import { useState } from "react";

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
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages }),
      });

      const data = await res.json();
      setMessages([...newMessages, { role: "assistant", content: data.reply }]);
    } catch (err) {
      console.error(err);
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
          className="rounded-md bg-emerald-500 px-4 py-2 text-sm text-white hover:bg-emerald-600"
        >
          Enviar
        </button>
      </div>
    </div>
  );
}

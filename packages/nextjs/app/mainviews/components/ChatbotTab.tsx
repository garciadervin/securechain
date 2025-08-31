"use client";

import { useState } from "react";
import { AuditData } from "./ResumenTab";

export default function ChatbotTab({ auditData }: { auditData: AuditData }) {
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;

    // Añadimos el mensaje del usuario al historial
    const newMessages = [...messages, { role: "user", content: input }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            {
              role: "system",
              content: `Eres un asistente experto en auditoría de contratos inteligentes. 
              Explica de forma clara y amigable. 
              Contexto del contrato: ${JSON.stringify(auditData)}`,
            },
            ...newMessages,
          ],
        }),
      });

      const data = await res.json();
      setMessages([...newMessages, { role: "assistant", content: data.reply }]);
    } catch (err) {
      console.error("Error en el chatbot:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-96 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      {/* Historial de mensajes */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3">
        {messages.map((m, i) => (
          <div key={i} className={m.role === "user" ? "text-right" : "text-left"}>
            <p
              className={`inline-block px-3 py-2 rounded-lg text-sm ${
                m.role === "user"
                  ? "bg-emerald-500 text-white"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              }`}
            >
              {m.content}
            </p>
          </div>
        ))}
        {loading && <p className="text-xs text-gray-500">Escribiendo...</p>}
      </div>

      {/* Input y botón */}
      <div className="p-3 border-t border-gray-200 dark:border-gray-700 flex gap-2">
        <input
          type="text"
          placeholder="Escribe tu pregunta..."
          value={input}
          onChange={e => setInput(e.target.value)}
          className="flex-1 px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm"
        />
        <button
          onClick={sendMessage}
          className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-md text-sm"
        >
          Enviar
        </button>
      </div>
    </div>
  );
}

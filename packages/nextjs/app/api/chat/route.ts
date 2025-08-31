import { NextResponse } from "next/server";
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    const completion = await groq.chat.completions.create({
      model: "openai/gpt-oss-20b", // o "gpt-oss-120b" si quieres más calidad
      messages,
      temperature: 0.7,
      max_tokens: 800,
    });

    return NextResponse.json({
      reply: completion.choices[0]?.message?.content ?? "",
    });
  } catch (error) {
    console.error("Error en API Chat:", error);
    return NextResponse.json({ reply: "Error al procesar la solicitud." }, { status: 500 });
  }
}

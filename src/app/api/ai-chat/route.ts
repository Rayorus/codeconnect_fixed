import { NextResponse } from 'next/server';
import OpenAI from "openai";

export const runtime = 'edge';

export async function POST(req: Request) {
  try {
    const { message } = await req.json();
    if (!message) {
      return NextResponse.json({ reply: 'Please provide a message.' }, { status: 400 });
    }

    // Debug log for env variable
    console.log('GROQ_API_KEY:', process.env.GROQ_API_KEY);

    const client = new OpenAI({
      apiKey: process.env.GROQ_API_KEY,
      baseURL: "https://api.groq.com/openai/v1"
    });

    const response = await client.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        { role: "system", content: "You are a helpful programming mentor." },
        { role: "user", content: message }
      ],
    });

    return NextResponse.json({ reply: response.choices[0].message.content });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "AI failed" });
  }
}

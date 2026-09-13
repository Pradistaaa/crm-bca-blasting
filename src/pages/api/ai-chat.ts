import type { APIRoute } from "astro";
import OpenAI from "openai";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const { messages } = await request.json();

    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response(
        JSON.stringify({
          error: "Pesan tidak boleh kosong."
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json"
          }
        }
      );
    }

    const conversation: ChatMessage[] = messages
      .filter(
        (item: unknown): item is ChatMessage =>
          typeof item === "object" &&
          item !== null &&
          ["user", "assistant"].includes(
            (item as ChatMessage).role
          ) &&
          typeof (item as ChatMessage).content === "string"
      )
      .slice(-12)
      .map(item => ({
        role: item.role,
        content: item.content.trim().slice(0, 3000)
      }))
      .filter(item => item.content);

    if (conversation.length === 0) {
      return new Response(
        JSON.stringify({
          error: "Pesan tidak boleh kosong."
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json"
          }
        }
      );
    }

    const openai = new OpenAI({
      apiKey: import.meta.env.OPENAI_API_KEY
    });

    const response = await openai.responses.create({
      model: "gpt-5.6-luna",
      store: false,
      max_output_tokens: 400,
      instructions: `
Kamu adalah Asisten LeadFlow, asisten internal untuk CRM BCA Blasting.
Jawab dalam bahasa Indonesia yang jelas, profesional, dan ringkas.

Kamu membantu pengguna untuk:
- membuat draft pesan campaign WhatsApp;
- membuat pesan follow-up;
- menjelaskan penggunaan fitur CRM;
- memberi saran tahapan lead: Quotations, Invoice, Penagihan,
  Progressing, Negotiation, atau Technical / POC;
- membantu merangkum atau menyusun langkah kerja sales.

Jangan mengaku sudah mengubah data CRM.
Jangan meminta atau menampilkan API key, password, atau data sensitif.
Jika informasi belum cukup, tanyakan satu pertanyaan klarifikasi.
      `.trim(),
      input: conversation
    });

    return new Response(
      JSON.stringify({
        reply: response.output_text
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json"
        }
      }
    );
  } catch (error) {
    console.error("AI chat error:", error);

    return new Response(
      JSON.stringify({
        error: "Asisten AI sedang tidak dapat merespons. Coba lagi."
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json"
        }
      }
    );
  }
};
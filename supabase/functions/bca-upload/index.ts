import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
const AI_GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function gerarEmbedding(texto: string): Promise<number[] | null> {
  if (!LOVABLE_API_KEY) return null;
  for (let t = 0; t < 3; t++) {
    try {
      const res = await fetch(AI_GATEWAY, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-lite",
          messages: [
            {
              role: "system",
              content: "You are an embedding generator. Return ONLY a JSON array of 768 floating point numbers representing the semantic embedding of the user's text. No explanation, no markdown, just the raw JSON array.",
            },
            { role: "user", content: `Generate a 768-dimensional embedding vector for this text:\n\n${texto.slice(0, 2000)}` },
          ],
          temperature: 0,
        }),
      });

      if (res.status === 429) {
        await new Promise((r) => setTimeout(r, 3000 * (t + 1)));
        continue;
      }

      const data = await res.json();
      const content = data?.choices?.[0]?.message?.content;
      if (content) {
        try {
          const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
          const arr = JSON.parse(cleaned);
          if (Array.isArray(arr) && arr.length === 768) return arr;
        } catch {}
      }
    } catch {}
  }
  return null;
}

function chunkText(text: string, chunkSize = 1000, overlap = 200): string[] {
  const chunks: string[] = [];
  let start = 0;
  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    chunks.push(text.slice(start, end));
    start += chunkSize - overlap;
  }
  return chunks;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY não configurada." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { fileName, content } = await req.json();
    if (!fileName || !content) throw new Error("fileName e content são obrigatórios.");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Check if document already exists
    const { data: existing } = await supabase
      .from("documents")
      .select("id")
      .eq("nome_arquivo", fileName)
      .maybeSingle();

    if (existing) {
      return new Response(
        JSON.stringify({ duplicate: true, message: "Documento já existe na base." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Insert document
    const { data: doc, error: docError } = await supabase
      .from("documents")
      .insert({ nome_arquivo: fileName, conteudo: content })
      .select("id")
      .single();

    if (docError) throw docError;

    // Chunk and embed
    const chunks = chunkText(content);
    let indexed = 0;

    for (const chunk of chunks) {
      const embedding = await gerarEmbedding(chunk);

      const insertData: any = {
        document_id: doc.id,
        nome_arquivo: fileName,
        conteudo: chunk,
      };

      if (embedding) {
        insertData.embedding = embedding;
      }

      const { error: chunkError } = await supabase
        .from("document_chunks")
        .insert(insertData);

      if (!chunkError) indexed++;

      // Small delay to avoid rate limits
      await new Promise((r) => setTimeout(r, 500));
    }

    return new Response(
      JSON.stringify({
        success: true,
        chunks_total: chunks.length,
        chunks_indexed: indexed,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("bca-upload error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

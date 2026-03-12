import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
const AI_GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";

// Gemini embeddings (768 dimensions)
const EMBED_URL = "https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function gerarEmbedding(texto: string): Promise<number[] | null> {
  if (!LOVABLE_API_KEY) return null;
  // Use Lovable AI gateway for embeddings via Gemini
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
          const arr = JSON.parse(content);
          if (Array.isArray(arr) && arr.length === 768) return arr;
        } catch {}
      }
    } catch {}
  }
  return null;
}

async function chamarIA(systemPrompt: string, userMessage: string): Promise<string | null> {
  if (!LOVABLE_API_KEY) return null;

  const res = await fetch(AI_GATEWAY, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
      temperature: 0.3,
      max_tokens: 4096,
    }),
  });

  if (res.status === 429) {
    return "⏳ Limite de requisições atingido. Tente novamente em instantes.";
  }
  if (res.status === 402) {
    return "💳 Créditos insuficientes. Adicione créditos ao workspace.";
  }
  if (!res.ok) return null;

  const data = await res.json();
  return data?.choices?.[0]?.message?.content ?? null;
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

    const { message, mode } = await req.json();
    if (!message) throw new Error("Mensagem não informada.");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // 1. Generate embedding for query
    const queryEmbedding = await gerarEmbedding(message);

    // 2. RAG search
    let contextText = "";
    if (queryEmbedding) {
      const { data: chunks } = await supabase.rpc("buscar_chunks_similares", {
        query_embedding: queryEmbedding,
        match_count: 5,
        match_threshold: 0.3,
      });

      if (chunks && chunks.length > 0) {
        contextText = chunks
          .map((c: any, i: number) => `[Trecho ${i + 1} - ${c.nome_arquivo}]\n${c.conteudo}`)
          .join("\n\n---\n\n")
          .slice(0, 8000);
      }
    }

    // 3. Build prompts
    let systemPrompt: string;

    if (mode === "comparador") {
      systemPrompt = `Você é um especialista jurídico. Responda sempre em português.
O usuário forneceu um texto ou cláusula de contrato externo. Sua tarefa é:
1. Identificar nos trechos da base as cláusulas mais similares.
2. Comparar lado a lado: texto fornecido vs. padrão da base.
3. Apontar diferenças de redação, termos, obrigações, prazos e penalidades.
4. Identificar riscos ou incompatibilidades.
5. Sugerir como adequar ao padrão.

Estruture sua resposta assim:
## 🔍 Cláusulas Similares na Base
## ⚖️ Comparação: Texto Fornecido × Padrão
## ⚠️ Diferenças e Riscos
## ✅ O que já está conforme
## 💡 Sugestão de Adequação`;
    } else if (mode === "clausulas") {
      systemPrompt = `Você é um assistente jurídico especializado em cláusulas contratuais. Responda sempre em português.
Com base nos trechos da base de conhecimento, identifique e liste todas as cláusulas aplicáveis à situação descrita pelo usuário.
Para cada cláusula, explique:
- O conteúdo da cláusula
- Por que ela se aplica à situação
- Pontos de atenção

Se não encontrar cláusulas na base, responda com conhecimento jurídico geral e informe que não há documentos específicos na base.`;
    } else {
      systemPrompt = `Você é um assistente jurídico. Responda sempre em português, de forma clara e objetiva.
Use os trechos da base de conhecimento para embasar suas respostas.
Se a informação não estiver na base, diga que não encontrou nos documentos mas responda com conhecimento jurídico geral.
Nunca invente informações jurídicas.`;
    }

    const userMessage = contextText
      ? `BASE DE CONHECIMENTO:\n${contextText}\n\nPERGUNTA: ${message}`
      : `Obs: Nenhum trecho relevante encontrado na base. Responda com conhecimento jurídico geral.\n\nPERGUNTA: ${message}`;

    // 4. Call AI
    const reply = await chamarIA(systemPrompt, userMessage);

    return new Response(
      JSON.stringify({ response: reply || "Sem resposta da IA. Tente novamente." }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("bca-chat error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

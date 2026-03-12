import { useState } from "react";
import { Search } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { supabase } from "@/integrations/supabase/client";

const ClausulasPanel = () => {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  const buscar = async () => {
    if (!query.trim() || loading) return;
    setLoading(true);
    setResult("");

    try {
      const { data, error } = await supabase.functions.invoke("bca-chat", {
        body: {
          message: `Busque na base de conhecimento as cláusulas aplicáveis à seguinte situação:\n\n${query}`,
          mode: "clausulas",
        },
      });
      if (error) throw error;
      setResult(data?.response || "Nenhum resultado encontrado.");
    } catch (err: any) {
      setResult(`❌ Erro: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="p-6 border-b border-border bg-card flex-shrink-0">
        <h2 className="font-display text-sm font-semibold text-foreground mb-1">
          Buscar Cláusulas
        </h2>
        <p className="text-xs text-muted-foreground">
          Descreva a situação e a IA retornará as cláusulas aplicáveis da base de conhecimento.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
        <div className="max-w-2xl w-full mx-auto flex flex-col gap-4">
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Descreva a situação contratual ou a pergunta sobre cláusulas..."
            rows={4}
            className="w-full bg-secondary border border-border rounded-lg p-4 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-gold transition-colors resize-none font-body"
          />
          <button
            onClick={buscar}
            disabled={loading || !query.trim()}
            className="w-full py-3 bg-background border border-border rounded-lg font-display text-xs font-bold tracking-widest uppercase text-gold-light hover:bg-secondary disabled:opacity-30 transition-all flex items-center justify-center gap-2"
          >
            {loading ? <div className="loading-ring" /> : <><Search size={14} /> Buscar Cláusulas</>}
          </button>

          {result && (
            <div className="animate-fade-up bg-card border border-border rounded-lg p-5">
              <div className="font-display text-[0.6rem] font-bold tracking-widest uppercase text-gold mb-3">
                📋 Cláusulas Encontradas
              </div>
              <div className="prose-legal">
                <ReactMarkdown>{result}</ReactMarkdown>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClausulasPanel;

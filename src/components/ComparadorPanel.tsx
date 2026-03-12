import { useState, useCallback } from "react";
import { Upload, FileText, Search } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { supabase } from "@/integrations/supabase/client";
import { extractTextFromFile } from "@/lib/fileExtractor";

const ComparadorPanel = () => {
  const [mode, setMode] = useState<"upload" | "text">("text");
  const [text, setText] = useState("");
  const [fileName, setFileName] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  const handleFile = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    try {
      const extracted = await extractTextFromFile(file);
      setText(extracted);
    } catch {
      setText("Erro ao extrair texto do arquivo.");
    }
  }, []);

  const comparar = async () => {
    if (!text.trim() || loading) return;
    setLoading(true);
    setResult("");

    try {
      const { data, error } = await supabase.functions.invoke("bca-chat", {
        body: { message: text, mode: "comparador" }
      });
      if (error) throw error;
      setResult(data?.response || "Sem resultado.");
    } catch (err: any) {
      setResult(`❌ Erro: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Left panel */}
      <div className="w-80 flex-shrink-0 border-r border-border overflow-y-auto p-5 flex flex-col gap-3 bg-secondary-foreground">
        <div className="font-display text-[0.65rem] font-bold tracking-widest uppercase text-gold">
          📤 Documento para Análise
        </div>

        <div className="flex border border-border rounded-lg overflow-hidden">
          <button
            onClick={() => setMode("upload")}
            className={`flex-1 py-2 font-display text-xs font-bold transition-all ${
            mode === "upload" ? "bg-background text-gold-light" : "bg-secondary text-muted-foreground"}`
            }>
            
            <Upload size={12} className="inline mr-1" /> Upload
          </button>
          <button
            onClick={() => setMode("text")}
            className={`flex-1 py-2 font-display text-xs font-bold transition-all ${
            mode === "text" ? "bg-background text-gold-light" : "bg-secondary text-muted-foreground"}`
            }>
            
            <FileText size={12} className="inline mr-1" /> Texto
          </button>
        </div>

        {mode === "upload" ?
        <div>
            <label className="block border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-gold transition-all bg-secondary">
              <input type="file" accept=".pdf,.doc,.docx,.txt" onChange={handleFile} className="hidden" />
              <div className="text-2xl mb-2">📄</div>
              <p className="text-xs text-muted-foreground">
                <strong className="text-gold">Clique</strong> ou arraste · TXT · PDF · DOCX
              </p>
            </label>
            {fileName &&
          <div className="mt-2 flex items-center gap-2 bg-gold-dim/20 border border-border rounded-lg p-2">
                <span>📄</span>
                <span className="text-xs text-foreground font-bold truncate">{fileName}</span>
              </div>
          }
          </div> :

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Cole ou digite o texto do contrato para comparar..."
          className="w-full flex-1 min-h-[200px] bg-secondary border border-border rounded-lg p-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-gold transition-colors resize-none font-body" />

        }

        <div className="text-right text-[0.66rem] text-muted-foreground">{text.length} caracteres</div>

        <button
          onClick={comparar}
          disabled={loading || !text.trim()}
          className="w-full py-3 bg-background border border-border rounded-lg font-display text-xs font-bold tracking-widest uppercase text-gold-light hover:bg-secondary disabled:opacity-30 transition-all mt-auto">
          
          {loading ? "Analisando..." : "🔍 Buscar e Comparar"}
        </button>

        <div className="bg-secondary rounded-lg p-3">
          <div className="font-display text-[0.6rem] font-bold tracking-widest uppercase text-foreground mb-2">
            Como funciona
          </div>
          <div className="text-xs text-muted-foreground leading-relaxed">
            🔍 Busca cláusulas similares na base<br />
            ⚖️ Compara redação e termos<br />
            ⚠️ Identifica diferenças e riscos<br />
            💡 Sugere adequações
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="font-display text-[0.7rem] font-bold tracking-widest uppercase text-gold mb-4">
          📊 Resultado da Comparação
        </div>

        {loading ?
        <div className="flex flex-col items-center justify-center py-16 gap-4">
            <div className="loading-ring" />
            <p className="text-sm text-muted-foreground">Buscando cláusulas similares...</p>
          </div> :
        result ?
        <div className="animate-fade-up bg-card border border-border rounded-lg p-5">
            <div className="prose-legal">
              <ReactMarkdown>{result}</ReactMarkdown>
            </div>
          </div> :

        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground text-center gap-4">
            <div className="text-5xl opacity-30">⚖️</div>
            <p className="text-sm leading-relaxed">
              Insira uma cláusula ou contrato<br />para buscar similares na base<br />e identificar diferenças
            </p>
          </div>
        }
      </div>
    </div>);

};

export default ComparadorPanel;
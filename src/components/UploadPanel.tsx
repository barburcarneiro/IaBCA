import { useState, useCallback } from "react";
import { Upload, X, Check, AlertCircle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { extractTextFromFile } from "@/lib/fileExtractor";

interface FileItem {
  file: File;
  status: "waiting" | "sending" | "done" | "error" | "duplicate";
  message?: string;
}

const UploadPanel = () => {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [sending, setSending] = useState(false);
  const [resultMsg, setResultMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const addFiles = useCallback((newFiles: FileList | File[]) => {
    const items = Array.from(newFiles).map((file) => ({ file, status: "waiting" as const }));
    setFiles((prev) => [...prev, ...items]);
    setResultMsg(null);
  }, []);

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadAll = async () => {
    if (sending) return;
    setSending(true);
    setResultMsg(null);

    const updated = [...files];
    let successCount = 0;
    let dupCount = 0;

    for (let i = 0; i < updated.length; i++) {
      if (updated[i].status === "done" || updated[i].status === "duplicate") continue;
      updated[i].status = "sending";
      setFiles([...updated]);

      try {
        const text = await extractTextFromFile(updated[i].file);
        if (!text.trim()) throw new Error("Texto vazio.");

        const { data, error } = await supabase.functions.invoke("bca-upload", {
          body: { fileName: updated[i].file.name, content: text },
        });

        if (error) throw error;

        if (data?.duplicate) {
          updated[i].status = "duplicate";
          updated[i].message = "Já existe na base";
          dupCount++;
        } else {
          updated[i].status = "done";
          successCount++;
        }
      } catch (err: any) {
        updated[i].status = "error";
        updated[i].message = err.message;
      }
      setFiles([...updated]);
    }

    setSending(false);
    const parts = [];
    if (successCount) parts.push(`${successCount} indexado(s)`);
    if (dupCount) parts.push(`${dupCount} duplicado(s)`);
    setResultMsg({ type: successCount > 0 ? "ok" : "err", text: parts.join(", ") || "Nenhum arquivo processado." });
  };

  const statusIcon = (status: FileItem["status"]) => {
    switch (status) {
      case "done": return <Check size={14} className="text-green-muted" />;
      case "error": return <AlertCircle size={14} className="text-destructive" />;
      case "sending": return <Loader2 size={14} className="animate-spin text-gold" />;
      case "duplicate": return <span className="text-xs text-muted-foreground">DUP</span>;
      default: return null;
    }
  };

  const statusLabel = (item: FileItem) => {
    switch (item.status) {
      case "waiting": return "Aguardando";
      case "sending": return "Enviando...";
      case "done": return "Indexado";
      case "error": return item.message || "Erro";
      case "duplicate": return item.message || "Duplicado";
    }
  };

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="p-6 border-b border-border bg-card flex-shrink-0">
        <h2 className="font-display text-sm font-semibold text-foreground mb-1">
          Adicionar Documentos à Base de Conhecimento
        </h2>
        <p className="text-xs text-muted-foreground">
          Envie documentos para indexação via embeddings — ficam disponíveis no Chat e Comparador
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4 max-w-2xl">
        {/* Drop zone */}
        <label className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-gold transition-all bg-secondary relative">
          <input
            type="file"
            accept=".pdf,.doc,.docx,.txt"
            multiple
            onChange={(e) => e.target.files && addFiles(e.target.files)}
            className="absolute inset-0 opacity-0 cursor-pointer"
          />
          <Upload size={32} className="mx-auto mb-3 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            <strong className="text-gold">Clique</strong> ou arraste seus documentos
          </p>
          <p className="text-xs text-muted-foreground mt-1">TXT · PDF · DOC · DOCX</p>
        </label>

        {/* File list */}
        {files.length > 0 && (
          <div className="flex flex-col gap-2">
            {files.map((item, i) => (
              <div key={i} className="flex items-center gap-3 bg-card border border-border rounded-lg p-3">
                <span className="text-lg">📄</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-foreground truncate">{item.file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(item.file.size / 1024).toFixed(1)} KB · {statusLabel(item)}
                  </p>
                </div>
                {statusIcon(item.status)}
                <button onClick={() => removeFile(i)} className="text-muted-foreground hover:text-destructive">
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Actions */}
        {files.length > 0 && (
          <div className="flex gap-3">
            <button
              onClick={uploadAll}
              disabled={sending}
              className="flex-1 py-3 bg-background border border-border rounded-lg font-display text-xs font-bold tracking-widest uppercase text-gold-light hover:bg-secondary disabled:opacity-30 transition-all"
            >
              {sending ? "Processando..." : "⚡ Indexar Documentos"}
            </button>
            <button
              onClick={() => { setFiles([]); setResultMsg(null); }}
              className="py-3 px-5 border border-border rounded-lg font-display text-xs font-semibold text-gold hover:bg-secondary transition-all"
            >
              Limpar
            </button>
          </div>
        )}

        {/* Result */}
        {resultMsg && (
          <div
            className={`p-3 rounded-lg text-sm ${
              resultMsg.type === "ok"
                ? "bg-green-muted/20 text-green-muted border border-green-muted/30"
                : "bg-destructive/10 text-destructive border border-destructive/30"
            }`}
          >
            {resultMsg.text}
          </div>
        )}

        {/* Tip */}
        <div className="bg-primary/10 border border-border rounded-lg p-3 text-xs text-gold leading-relaxed">
          💡 Documentos já existentes na base não serão duplicados. O sistema verifica automaticamente pelo nome do arquivo.
        </div>
      </div>
    </div>
  );
};

export default UploadPanel;

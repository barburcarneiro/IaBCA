import { useState, useRef, useEffect } from "react";
import { Send } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { supabase } from "@/integrations/supabase/client";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const CHIPS = [
"Quais são as penalidades contratuais mais comuns?",
"Explique o sigilo profissional em contratos",
"O que é cláusula de não concorrência?",
"Como funciona a rescisão contratual?"];


const ChatPanel = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEnd = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEnd.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (text?: string) => {
    const msg = text || input.trim();
    if (!msg || loading) return;
    setInput("");

    const userMsg: Message = { role: "user", content: msg };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("bca-chat", {
        body: { message: msg, mode: "chat" }
      });

      if (error) throw error;

      const reply = data?.response || "Sem resposta da IA.";
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch (err: any) {
      setMessages((prev) => [
      ...prev,
      { role: "assistant", content: `❌ Erro: ${err.message}` }]
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4 bg-secondary-foreground">
        {/* Welcome */}
        {messages.length === 0 &&
        <div className="animate-fade-up flex gap-3">
            <div className="w-8 h-8 rounded-full bg-background flex items-center justify-center text-xs font-display font-bold text-gold-light flex-shrink-0">
              BCA
            </div>
            <div>
              <div className="border border-border rounded-xl rounded-tl-none p-4 max-w-xl bg-muted">
                <h3 className="font-display text-sm font-semibold text-gold-light mb-2">
                  Assistente Jurídico
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Olá! Estou conectado à base de conhecimento via RAG. Faça sua consulta jurídica abaixo.
                </p>
                <div className="flex flex-wrap gap-2 mt-3">
                  {CHIPS.map((chip) =>
                <button
                  key={chip}
                  onClick={() => sendMessage(chip)}
                  className="px-3 py-1 border border-border rounded-full text-xs text-gold hover:bg-gold hover:text-background transition-all">
                  
                      {chip}
                    </button>
                )}
                </div>
              </div>
              <p className="text-[0.69rem] text-gold mt-1">🤖 Lovable AI · RAG</p>
            </div>
          </div>
        }

        {messages.map((msg, i) =>
        <div
          key={i}
          className={`animate-fade-up flex gap-3 ${msg.role === "user" ? "flex-row-reverse self-end" : ""}`}>
          
            <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-display font-bold flex-shrink-0 ${
            msg.role === "user" ?
            "bg-gold-light text-background" :
            "bg-background text-gold-light"}`
            }>
            
              {msg.role === "user" ? "U" : "BCA"}
            </div>
            <div
            className={`max-w-xl p-4 text-sm leading-relaxed border border-border ${
            msg.role === "user" ?
            "bg-gold-dim/20 rounded-xl rounded-tr-none" :
            "bg-card rounded-xl rounded-tl-none"}`
            }>
            
              {msg.role === "assistant" ?
            <div className="prose-legal">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div> :

            msg.content
            }
            </div>
          </div>
        )}

        {loading &&
        <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-background flex items-center justify-center text-xs font-display font-bold text-gold-light flex-shrink-0">
              BCA
            </div>
            <div className="p-4">
              <div className="loading-ring" />
            </div>
          </div>
        }
        <div ref={messagesEnd} />
      </div>

      <div className="p-4 border-t border-border bg-card flex-shrink-0">
        <div className="flex gap-2 items-end bg-secondary border border-border rounded-lg p-3 focus-within:border-gold transition-colors">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            placeholder="Digite sua consulta jurídica..."
            rows={1}
            className="flex-1 bg-transparent border-none outline-none text-foreground text-sm resize-none max-h-28 placeholder:text-muted-foreground font-body" />
          
          <button
            onClick={() => sendMessage()}
            disabled={loading || !input.trim()}
            className="w-9 h-9 rounded-lg bg-background flex items-center justify-center text-gold-light hover:bg-secondary disabled:opacity-30 transition-all flex-shrink-0">
            
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>);

};

export default ChatPanel;
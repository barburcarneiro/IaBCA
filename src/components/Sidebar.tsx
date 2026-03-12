import { MessageSquare, Scale, Upload, FileText } from "lucide-react";

type Tab = "chat" | "comparador" | "upload" | "clausulas";

interface SidebarProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}

const navItems: { id: Tab; label: string; icon: React.ReactNode; section: string }[] = [
  { id: "chat", label: "Chat Jurídico", icon: <MessageSquare size={16} />, section: "Ferramentas" },
  { id: "clausulas", label: "Buscar Cláusulas", icon: <FileText size={16} />, section: "Ferramentas" },
  { id: "comparador", label: "Comparador", icon: <Scale size={16} />, section: "Ferramentas" },
  { id: "upload", label: "Adicionar Docs", icon: <Upload size={16} />, section: "Base de Conhecimento" },
];

const Sidebar = ({ activeTab, onTabChange }: SidebarProps) => {
  const sections = [...new Set(navItems.map((i) => i.section))];

  return (
    <div className="w-56 bg-card border-r border-border flex flex-col flex-shrink-0">
      {sections.map((section) => (
        <div key={section} className="pt-6 px-4 pb-2">
          <div className="font-display text-[0.6rem] font-bold tracking-[0.22em] uppercase text-gold px-2 mb-2">
            {section}
          </div>
          {navItems
            .filter((i) => i.section === section)
            .map((item) => (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`flex items-center gap-2.5 w-full px-3 py-2.5 rounded-lg text-sm transition-all mb-0.5 border ${
                  activeTab === item.id
                    ? "bg-primary/10 text-gold border-border font-bold"
                    : "text-muted-foreground border-transparent hover:bg-secondary hover:text-foreground"
                }`}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
        </div>
      ))}
      <div className="mt-auto p-4 border-t border-border">
        <p className="text-[0.68rem] text-muted-foreground text-center leading-relaxed">
          🔒 Dados processados via<br />Lovable AI + RAG
        </p>
      </div>
    </div>
  );
};

export default Sidebar;

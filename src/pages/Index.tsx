import { useState } from "react";
import TopBar from "@/components/TopBar";
import Sidebar from "@/components/Sidebar";
import ChatPanel from "@/components/ChatPanel";
import ClausulasPanel from "@/components/ClausulasPanel";
import ComparadorPanel from "@/components/ComparadorPanel";
import UploadPanel from "@/components/UploadPanel";

type Tab = "chat" | "comparador" | "upload" | "clausulas";

const tabLabels: Record<Tab, string> = {
  chat: "Chat Jurídico",
  clausulas: "Buscar Cláusulas",
  comparador: "Comparador de Contratos",
  upload: "Adicionar Documentos"
};

const Index = () => {
  const [activeTab, setActiveTab] = useState<Tab>("chat");

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <TopBar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          {/* Tab bar */}
          <div className="flex bg-card border-b border-border flex-shrink-0 overflow-x-auto">
            {(Object.keys(tabLabels) as Tab[]).map((tab) => {}











            )}
          </div>

          {/* Panels */}
          {activeTab === "chat" && <ChatPanel />}
          {activeTab === "clausulas" && <ClausulasPanel />}
          {activeTab === "comparador" && <ComparadorPanel />}
          {activeTab === "upload" && <UploadPanel />}
        </div>
      </div>
    </div>);

};

export default Index;
const TopBar = () => {
  return (
    <div className="flex items-center justify-between px-8 h-14 flex-shrink-0 border-b border-border bg-secondary-foreground">
      <div className="flex items-center gap-3.5">
        <span className="font-display font-bold text-xl text-gold-light tracking-widest">BCA</span>
        <div className="w-px h-4 bg-border" />
        <span className="font-body font-light text-muted-foreground tracking-[0.2em] uppercase text-sm">
          Assistente Jurídico
        </span>
      </div>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <div className="w-2 h-2 rounded-full bg-green-muted animate-pulse-dot" />
        <span>RAG Ativo</span>
      </div>
    </div>);

};

export default TopBar;
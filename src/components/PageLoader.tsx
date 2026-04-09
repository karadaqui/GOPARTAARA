const PageLoader = () => (
  <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background">
    <div className="flex flex-col items-center gap-4 animate-fade-in">
      <div className="relative w-12 h-12">
        <div className="absolute inset-0 rounded-full border-2 border-primary/20" />
        <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-primary animate-spin" />
      </div>
      <span className="font-display text-sm font-bold tracking-[3px] text-muted-foreground uppercase">PARTARA</span>
    </div>
  </div>
);

export default PageLoader;

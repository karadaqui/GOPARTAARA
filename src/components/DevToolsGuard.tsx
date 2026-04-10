import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

const DevToolsGuard = () => {
  const { toast } = useToast();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // F12
      if (e.key === "F12") {
        e.preventDefault();
        toast({
          title: "This action is not permitted on PARTARA",
          variant: "destructive",
        });
        return;
      }
      // Ctrl+Shift+I / Cmd+Option+I
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "I") {
        e.preventDefault();
        toast({
          title: "This action is not permitted on PARTARA",
          variant: "destructive",
        });
        return;
      }
      // Ctrl+Shift+J / Cmd+Option+J (console)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "J") {
        e.preventDefault();
        toast({
          title: "This action is not permitted on PARTARA",
          variant: "destructive",
        });
      }
    };

    // Disable right-click context menu
    const contextHandler = (e: MouseEvent) => {
      e.preventDefault();
      toast({
        title: "This action is not permitted on PARTARA",
        variant: "destructive",
      });
    };

    document.addEventListener("keydown", handler);
    document.addEventListener("contextmenu", contextHandler);
    return () => {
      document.removeEventListener("keydown", handler);
      document.removeEventListener("contextmenu", contextHandler);
    };
  }, [toast]);

  return null;
};

export default DevToolsGuard;

import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

const DevToolsGuard = () => {
  const { toast } = useToast();

  useEffect(() => {
    // Console warning for devtools
    const warningStyle = "color: red; font-size: 24px; font-weight: bold;";
    const normalStyle = "font-size: 16px; color: #333;";
    console.log(
      "%c⛔ STOP!\n%cWarning: Do not paste code here that you do not understand.\nThis could allow attackers to steal your information.\n\nIf someone told you to copy/paste something here, it is a scam.\nFor more info see https://en.wikipedia.org/wiki/Self-XSS",
      warningStyle,
      normalStyle
    );
    
    // Repeat periodically so it's visible when console is opened later
    const interval = setInterval(() => {
      console.log(
        "%c⛔ Warning: Do not paste code here that you do not understand. This could allow attackers to steal your information.",
        "color: red; font-size: 14px; font-weight: bold;"
      );
    }, 10000);

    const handler = (e: KeyboardEvent) => {
      // F12
      if (e.key === "F12") {
        e.preventDefault();
        toast({ title: "This action is not permitted on PARTARA", variant: "destructive" });
        return;
      }
      // Ctrl+Shift+I / Cmd+Option+I
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === "I" || e.key === "i")) {
        e.preventDefault();
        toast({ title: "This action is not permitted on PARTARA", variant: "destructive" });
        return;
      }
      // Ctrl+Shift+J / Cmd+Option+J (console)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === "J" || e.key === "j")) {
        e.preventDefault();
        toast({ title: "This action is not permitted on PARTARA", variant: "destructive" });
        return;
      }
      // Ctrl+Shift+C (element inspector)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === "C" || e.key === "c")) {
        e.preventDefault();
        toast({ title: "This action is not permitted on PARTARA", variant: "destructive" });
      }
      // Ctrl+U (view source)
      if ((e.ctrlKey || e.metaKey) && (e.key === "U" || e.key === "u")) {
        e.preventDefault();
        toast({ title: "This action is not permitted on PARTARA", variant: "destructive" });
      }
    };

    const contextHandler = (e: MouseEvent) => {
      e.preventDefault();
      toast({ title: "Right-click is disabled for security.", variant: "destructive" });
    };

    document.addEventListener("keydown", handler);
    document.addEventListener("contextmenu", contextHandler);
    
    return () => {
      clearInterval(interval);
      document.removeEventListener("keydown", handler);
      document.removeEventListener("contextmenu", contextHandler);
    };
  }, [toast]);

  return null;
};

export default DevToolsGuard;

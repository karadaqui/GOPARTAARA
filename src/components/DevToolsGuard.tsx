import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

const DevToolsGuard = () => {
  const { toast } = useToast();

  useEffect(() => {
    // Console warning for devtools
    const warningStyle = "color: red; font-size: 18px; font-weight: bold;";
    const normalStyle = "font-size: 14px;";
    console.log(
      "%c⚠ Warning!\n%cThis is a browser feature intended for developers.\nDo not paste or type code here that you do not understand.\nThis could allow attackers to steal your information or impersonate you.\n\nIf someone told you to paste something here, it is likely a scam.",
      warningStyle,
      normalStyle
    );

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
      document.removeEventListener("keydown", handler);
      document.removeEventListener("contextmenu", contextHandler);
    };
  }, [toast]);

  return null;
};

export default DevToolsGuard;

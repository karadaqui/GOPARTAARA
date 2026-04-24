import { Headphones } from "lucide-react";
import { Button } from "@/components/ui/button";

const PrioritySupportButton = ({ displayName }: { displayName: string }) => {
  const subject = encodeURIComponent(`Priority Support Request - ${displayName || "Business User"}`);
  const body = encodeURIComponent("Hi GOPARTARA team,\n\nI need help with:\n\n");
  
  return (
    <Button
      asChild
      variant="outline"
      className="rounded-xl gap-2 border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
    >
      <a href={`mailto:info@gopartara.com?subject=${subject}&body=${body}`}>
        <Headphones size={16} />
        Priority Support
      </a>
    </Button>
  );
};

export default PrioritySupportButton;

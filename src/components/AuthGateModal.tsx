import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { LogIn, UserPlus } from "lucide-react";

interface AuthGateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
}

const AuthGateModal = ({ open, onOpenChange, title, description }: AuthGateModalProps) => {
  const navigate = useNavigate();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3 mt-4">
          <Button onClick={() => { onOpenChange(false); navigate("/auth"); }} className="gap-2 rounded-xl">
            <LogIn size={16} />
            Sign In
          </Button>
          <Button variant="outline" onClick={() => { onOpenChange(false); navigate("/auth"); }} className="gap-2 rounded-xl">
            <UserPlus size={16} />
            Create Free Account
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AuthGateModal;

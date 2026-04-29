import { useNavigate } from "react-router-dom";
import { X } from "lucide-react";

interface AnonSearchLimitModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AnonSearchLimitModal = ({ open, onOpenChange }: AnonSearchLimitModalProps) => {
  const navigate = useNavigate();
  if (!open) return null;

  const close = () => onOpenChange(false);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={close}
      style={{ fontFamily: '"DM Sans", system-ui, sans-serif' }}
    >
      <div
        className="relative w-full max-w-md mx-4 rounded-2xl"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#0d0d0d",
          border: "1px solid #1a1a1a",
          padding: "32px",
        }}
      >
        <button
          onClick={close}
          aria-label="Close"
          className="absolute top-4 right-4 text-zinc-500 hover:text-zinc-200 transition-colors"
        >
          <X size={18} />
        </button>

        <h3
          style={{
            fontFamily: '"Barlow Condensed", system-ui, sans-serif',
            fontWeight: 700,
            fontSize: "28px",
            lineHeight: 1.15,
            letterSpacing: "-0.01em",
            color: "#ffffff",
            marginBottom: "10px",
          }}
        >
          You've used your 3 free searches
        </h3>
        <p style={{ fontSize: "14px", color: "#888", lineHeight: 1.55, marginBottom: "24px" }}>
          Create a free account to get 20 searches per month — no card needed.
        </p>

        <div className="flex flex-col gap-2">
          <button
            onClick={() => { close(); navigate("/auth?mode=signup"); }}
            style={{
              height: "48px",
              borderRadius: "12px",
              background: "#cc1111",
              color: "#ffffff",
              fontWeight: 600,
              fontSize: "14px",
              border: "none",
              cursor: "pointer",
              transition: "background 120ms ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#aa0000")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#cc1111")}
          >
            Create free account
          </button>
          <button
            onClick={() => { close(); navigate("/auth?mode=signin"); }}
            style={{
              height: "48px",
              borderRadius: "12px",
              background: "transparent",
              color: "#f0f0f0",
              fontWeight: 500,
              fontSize: "14px",
              border: "1px solid #2a2a2a",
              cursor: "pointer",
              transition: "border-color 120ms ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#3a3a3a")}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#2a2a2a")}
          >
            Sign in
          </button>
        </div>

        <p style={{ fontSize: "12px", color: "#555", marginTop: "20px", textAlign: "center", lineHeight: 1.5 }}>
          Free accounts get 20 searches/month, price alerts, and My Garage.
        </p>
      </div>
    </div>
  );
};

export default AnonSearchLimitModal;

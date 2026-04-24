import { useState } from "react";
import { Share2, Check } from "lucide-react";
import { toast } from "sonner";

const HomeShareRow = () => {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const url = "https://gopartara.com";
    const shareData = {
      title: "GOPARTARA — Find any car part instantly",
      text: "Compare prices on 1,000,000+ car parts from trusted UK & global suppliers.",
      url,
    };

    if (typeof navigator !== "undefined" && (navigator as Navigator & { share?: (data: ShareData) => Promise<void> }).share) {
      try {
        await (navigator as Navigator & { share: (data: ShareData) => Promise<void> }).share(shareData);
        return;
      } catch {
        // user cancelled — fall through to copy
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Link copied — share GOPARTARA with a friend!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not copy link");
    }
  };

  return (
    <section className="px-4 py-10">
      <div
        className="max-w-3xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-3 text-center"
      >
        <span style={{ fontSize: "14px", color: "#71717a" }}>
          Know someone who works on cars?
        </span>
        <button
          type="button"
          onClick={handleShare}
          className="home-share-btn inline-flex items-center gap-2"
          style={{
            background: "transparent",
            border: "1px solid #3f3f46",
            color: "#a1a1aa",
            padding: "9px 16px",
            borderRadius: "8px",
            fontSize: "14px",
            fontWeight: 500,
            transition: "color 150ms, border-color 150ms, background-color 150ms",
            cursor: "pointer",
          }}
        >
          {copied ? (
            <>
              <Check size={14} /> Link copied!
            </>
          ) : (
            <>
              <Share2 size={14} /> Share GOPARTARA →
            </>
          )}
        </button>
      </div>
      <style>{`
        .home-share-btn:hover {
          color: #ffffff !important;
          border-color: #52525b !important;
          background: rgba(255,255,255,0.03) !important;
        }
      `}</style>
    </section>
  );
};

export default HomeShareRow;

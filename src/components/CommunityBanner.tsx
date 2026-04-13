import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import ScrollReveal from "@/components/ScrollReveal";

const CommunityBanner = () => {
  const navigate = useNavigate();

  const handleShare = async () => {
    const shareData = {
      title: "PARTARA",
      text: "Find car parts cheaper with PARTARA — gopartara.com 🔧",
      url: "https://gopartara.com",
    };
    if (navigator.share) {
      try { await navigator.share(shareData); } catch { }
    } else {
      await navigator.clipboard.writeText(shareData.text);
    }
  };

  return (
    <ScrollReveal className="max-w-6xl mx-auto mt-12">
      <div className="bg-gradient-to-r from-red-950/40 to-zinc-900/40 border border-red-500/20 rounded-2xl p-8 text-center">
        <div className="text-4xl mb-4">🚀</div>
        <h3 className="text-xl md:text-2xl font-bold text-white mb-2">Help Us Grow PARTARA</h3>
        <p className="text-sm text-zinc-400 max-w-lg mx-auto mb-6 leading-relaxed">
          We're a small team building something big. Your support helps us add more suppliers, better features, and lower prices for everyone.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-4">
          <Button variant="ghost" onClick={handleShare} className="border border-white/10 text-zinc-300 hover:text-white hover:bg-white/5">
            Share PARTARA
          </Button>
          <Button onClick={() => navigate("/pricing")} className="bg-red-600 hover:bg-red-500 text-white">
            Upgrade to Pro
          </Button>
        </div>
        <p className="text-xs text-zinc-500">Already used by thousands of car owners across the UK 🇬🇧</p>
      </div>
    </ScrollReveal>
  );
};

export default CommunityBanner;

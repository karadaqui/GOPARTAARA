import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { Zap } from "lucide-react";

export default function EvCharging() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#080808] flex flex-col">
      <SEOHead
        title="EV Charging — Under Maintenance | GOPARTARA"
        description="Our EV charging accessories section is being wired up. Check back shortly."
      />
      <Navbar />

      <main
        className="flex-1 flex flex-col items-center justify-center text-center"
        style={{ padding: "80px 48px" }}
      >
        <div
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontWeight: 600,
            fontSize: 11,
            color: "#cc1111",
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            marginBottom: 24,
          }}
        >
          EV Charging
        </div>

        <Zap
          style={{
            width: 64,
            height: 64,
            color: "#cc1111",
            opacity: 0.8,
            marginBottom: 32,
          }}
          strokeWidth={1.75}
        />

        <h1
          style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 800,
            fontSize: 56,
            color: "#ffffff",
            lineHeight: 0.95,
            textAlign: "center",
            maxWidth: 600,
            margin: "0 auto",
          }}
        >
          We're charging up this page.
        </h1>

        <p
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontWeight: 400,
            fontSize: 16,
            color: "#555555",
            maxWidth: 480,
            margin: "20px auto 40px",
            lineHeight: 1.7,
            textAlign: "center",
          }}
        >
          Our EV charging accessories section is being wired up. Check back
          shortly — we're connecting the best UK charging cables and EV
          accessories from EV King.
        </p>

        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => navigate("/search")}
            style={{
              background: "#cc1111",
              border: "none",
              borderRadius: 10,
              padding: "12px 28px",
              fontFamily: "'DM Sans', sans-serif",
              fontWeight: 600,
              fontSize: 14,
              color: "#ffffff",
              cursor: "pointer",
            }}
          >
            Back to Search
          </button>
          <button
            onClick={() => navigate("/deals")}
            style={{
              background: "transparent",
              border: "1px solid #2a2a2a",
              borderRadius: 10,
              padding: "12px 28px",
              fontFamily: "'DM Sans', sans-serif",
              fontWeight: 500,
              fontSize: 14,
              color: "#888888",
              cursor: "pointer",
            }}
          >
            View All Deals
          </button>
        </div>

        <div
          className="flex items-center justify-center"
          style={{ gap: 8, marginTop: 32 }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              background: "#22c55e",
              borderRadius: "50%",
              display: "inline-block",
              animation: "evk-pulse 2s infinite",
            }}
          />
          <span
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontWeight: 400,
              fontSize: 13,
              color: "#444444",
            }}
          >
            EV King integration in progress
          </span>
        </div>

        <style>{`
          @keyframes evk-pulse {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.5; transform: scale(1.3); }
          }
        `}</style>
      </main>

      <Footer />
    </div>
  );
}

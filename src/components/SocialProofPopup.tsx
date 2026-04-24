import { useEffect, useRef, useState } from "react";

const MESSAGES = [
  "🔍 James from Leeds just found brake pads for £12 less",
  "⭐ Sarah from Manchester saved £45 comparing suppliers",
  "🔧 Tom from Birmingham found a clutch kit for £67 less",
  "💰 Aisha from London saved £28 on a timing belt",
  "🚗 Mark from Glasgow compared 7 suppliers in seconds",
  "✨ Emma from Bristol found tyres £34 cheaper",
  "🔥 Liam from Sheffield saved £19 on an oil filter",
  "⚡ Olivia from Cardiff found a radiator for £52 less",
  "🛠️ Daniel from Liverpool saved £41 on suspension parts",
  "📦 Sophie from Newcastle found a starter motor £37 cheaper",
  "🏁 Ethan from Nottingham saved £23 on spark plugs",
  "🔍 Grace from Edinburgh found a DPF filter for £88 less",
  "⭐ Harry from Southampton compared prices and saved £31",
  "💡 Mia from Leicester found brake discs £18 cheaper",
  "🚙 Jacob from Bradford saved £56 on a water pump",
];

const pickRandom = () => MESSAGES[Math.floor(Math.random() * MESSAGES.length)];

const SocialProofPopup = () => {
  const [message, setMessage] = useState<string | null>(null);
  const [fading, setFading] = useState(false);
  const lastInteractionRef = useRef<number>(Date.now());

  useEffect(() => {
    if (typeof window === "undefined") return;

    const updateInteraction = () => {
      lastInteractionRef.current = Date.now();
    };
    window.addEventListener("mousemove", updateInteraction, { passive: true });
    window.addEventListener("keydown", updateInteraction);
    window.addEventListener("scroll", updateInteraction, { passive: true });

    let scheduleId: number;
    let hideId: number;
    let fadeId: number;

    const schedule = () => {
      const delay = 30000 + Math.floor(Math.random() * 15000); // 30–45s
      scheduleId = window.setTimeout(() => {
        // Skip if user is actively interacting (within last 2s)
        if (Date.now() - lastInteractionRef.current < 2000) {
          schedule();
          return;
        }
        setMessage(pickRandom());
        setFading(false);
        // Start fade-out at 3.6s, fully hide at 4s
        fadeId = window.setTimeout(() => setFading(true), 3600);
        hideId = window.setTimeout(() => {
          setMessage(null);
          setFading(false);
          schedule();
        }, 4000);
      }, delay);
    };

    // First popup after 30–45s
    schedule();

    return () => {
      window.clearTimeout(scheduleId);
      window.clearTimeout(hideId);
      window.clearTimeout(fadeId);
      window.removeEventListener("mousemove", updateInteraction);
      window.removeEventListener("keydown", updateInteraction);
      window.removeEventListener("scroll", updateInteraction);
    };
  }, []);

  if (!message) return null;

  return (
    <div
      className="fixed z-[9997]"
      style={{
        bottom: 80,
        left: 16,
        width: 280,
        maxWidth: "calc(100vw - 32px)",
        background: "#111111",
        border: "1px solid #1f1f1f",
        borderRadius: 10,
        padding: "12px 16px",
        color: "#d4d4d8",
        fontSize: 13,
        lineHeight: 1.4,
        boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
        opacity: fading ? 0 : 1,
        transform: fading ? "translateY(8px)" : "translateY(0)",
        transition: "opacity 400ms ease, transform 400ms ease",
      }}
      role="status"
      aria-live="polite"
    >
      {message}
    </div>
  );
};

export default SocialProofPopup;

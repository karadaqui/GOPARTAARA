import { useEffect, useRef, useState } from "react";

const MESSAGES: { emoji: string; text: string }[] = [
  { emoji: "🔍", text: "James from Leeds just found brake pads for £12 less" },
  { emoji: "⭐", text: "Sarah from Manchester saved £45 comparing suppliers" },
  { emoji: "🔔", text: "Price alert triggered — BMW filter dropped to £8.99" },
  { emoji: "🚗", text: "David from Glasgow just compared 7 suppliers in 3 seconds" },
  { emoji: "💰", text: "Emma from Bristol saved £67 on a starter motor" },
  { emoji: "✅", text: "Marco from London found OEM parts at aftermarket prices" },
  { emoji: "🔍", text: "Priya from Birmingham found her car part in 8 seconds" },
  { emoji: "⭐", text: "Gary from Edinburgh saves £800/month using GOPARTARA" },
];

const MAX_PER_SESSION = 3;
const STORAGE_KEY = "social_proof_count";
const INITIAL_DELAY = 15000; // 15s
const INTERVAL = 35000; // 35s
const VISIBLE_MS = 4000; // 4s on screen
const ANIM_MS = 300;

const pickRandom = () => MESSAGES[Math.floor(Math.random() * MESSAGES.length)];

const SocialProofPopup = () => {
  const [item, setItem] = useState<{ emoji: string; text: string } | null>(null);
  const [visible, setVisible] = useState(false);
  const shownCountRef = useRef(0);

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      shownCountRef.current = parseInt(sessionStorage.getItem(STORAGE_KEY) || "0", 10) || 0;
    } catch {
      shownCountRef.current = 0;
    }

    let initialId: number;
    let intervalId: number;
    let hideId: number;
    let unmountId: number;

    const showOne = () => {
      if (shownCountRef.current >= MAX_PER_SESSION) {
        window.clearInterval(intervalId);
        return;
      }
      setItem(pickRandom());
      // next frame → animate in
      requestAnimationFrame(() => setVisible(true));
      shownCountRef.current += 1;
      try {
        sessionStorage.setItem(STORAGE_KEY, String(shownCountRef.current));
      } catch {
        /* ignore */
      }
      // animate out after VISIBLE_MS
      hideId = window.setTimeout(() => {
        setVisible(false);
        unmountId = window.setTimeout(() => setItem(null), ANIM_MS);
      }, VISIBLE_MS);
    };

    initialId = window.setTimeout(() => {
      showOne();
      intervalId = window.setInterval(showOne, INTERVAL);
    }, INITIAL_DELAY);

    return () => {
      window.clearTimeout(initialId);
      window.clearInterval(intervalId);
      window.clearTimeout(hideId);
      window.clearTimeout(unmountId);
    };
  }, []);

  if (!item) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: "fixed",
        bottom: 80,
        left: 16,
        width: 280,
        maxWidth: "calc(100vw - 32px)",
        zIndex: 40,
        background: "#111111",
        border: "1px solid #1f1f1f",
        borderRadius: 10,
        padding: "12px 16px",
        color: "#d4d4d8",
        fontSize: 13,
        lineHeight: 1.4,
        boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        gap: 10,
        transform: visible ? "translateX(0)" : "translateX(-120%)",
        transition: `transform ${ANIM_MS}ms ease`,
        willChange: "transform",
      }}
    >
      <span style={{ fontSize: 18, lineHeight: 1, flexShrink: 0 }} aria-hidden>
        {item.emoji}
      </span>
      <span>{item.text}</span>
    </div>
  );
};

export default SocialProofPopup;

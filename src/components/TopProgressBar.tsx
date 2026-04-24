import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";

/**
 * Branded top progress bar shown during route transitions.
 * Animates from 0 → ~90% on navigation start, jumps to 100% on completion, then fades out.
 */
const TopProgressBar = () => {
  const location = useLocation();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const timersRef = useRef<number[]>([]);
  const isFirstRender = useRef(true);

  useEffect(() => {
    // Skip initial mount so we don't flash on first paint
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    // Reset & start
    timersRef.current.forEach((t) => window.clearTimeout(t));
    timersRef.current = [];

    setVisible(true);
    setProgress(0);

    // Animate in steps to feel snappy and "real"
    const steps: { at: number; value: number }[] = [
      { at: 20, value: 30 },
      { at: 180, value: 60 },
      { at: 420, value: 85 },
      { at: 700, value: 100 },
    ];
    steps.forEach(({ at, value }) => {
      const id = window.setTimeout(() => setProgress(value), at);
      timersRef.current.push(id);
    });

    // Fade out after completion
    const fadeId = window.setTimeout(() => setVisible(false), 950);
    timersRef.current.push(fadeId);

    // Reset width after the fade so next nav starts from 0
    const resetId = window.setTimeout(() => setProgress(0), 1300);
    timersRef.current.push(resetId);

    return () => {
      timersRef.current.forEach((t) => window.clearTimeout(t));
      timersRef.current = [];
    };
  }, [location.pathname, location.search]);

  return (
    <div
      aria-hidden
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        height: "2px",
        zIndex: 9999,
        pointerEvents: "none",
        opacity: visible ? 1 : 0,
        transition: "opacity 250ms ease",
      }}
    >
      <div
        style={{
          height: "100%",
          width: `${progress}%`,
          background: "#cc1111",
          boxShadow: "0 0 8px rgba(204,17,17,0.6)",
          transition: "width 280ms ease",
        }}
      />
    </div>
  );
};

export default TopProgressBar;

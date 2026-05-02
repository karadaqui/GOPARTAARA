import { useEffect, useState } from "react";

const LiveActivityCounter = () => {
  const [watching, setWatching] = useState(247);
  const [searches, setSearches] = useState(1284);
  const [saved, setSaved] = useState(8432);

  useEffect(() => {
    const id = setInterval(() => {
      // small random fluctuations
      setWatching((w) => Math.max(180, w + (Math.floor(Math.random() * 7) - 3)));
      setSearches((s) => s + Math.floor(Math.random() * 4));
      setSaved((v) => v + Math.floor(Math.random() * 25));
    }, 3500);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="w-full flex justify-center px-4 -mt-2 mb-6" aria-label="Live activity">
      <div
        className="inline-flex flex-wrap items-center justify-center gap-x-4 gap-y-1"
        style={{
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 999,
          padding: "6px 14px",
          fontSize: 12,
          color: "#a1a1aa",
          fontWeight: 500,
          maxWidth: "100%",
        }}
      >
        <span className="inline-flex items-center gap-1.5">
          <span
            className="rounded-full bg-emerald-500 animate-pulse"
            style={{ width: 6, height: 6 }}
            aria-hidden="true"
          />
          <span aria-hidden="true">👁</span>
          <span style={{ color: "#e4e4e7", fontWeight: 700 }}>
            {watching.toLocaleString()}
          </span>{" "}
          searching now
        </span>
        <span aria-hidden="true" style={{ color: "#3f3f46" }}>·</span>
        <span className="inline-flex items-center gap-1.5">
          <span aria-hidden="true">🔍</span>
          <span style={{ color: "#e4e4e7", fontWeight: 700 }}>
            {searches.toLocaleString()}
          </span>{" "}
          searches today
        </span>
        <span aria-hidden="true" style={{ color: "#3f3f46" }}>·</span>
        <span className="inline-flex items-center gap-1.5">
          <span aria-hidden="true">💰</span>
          <span style={{ color: "#22c55e", fontWeight: 700 }}>
            £{saved.toLocaleString()}
          </span>{" "}
          saved today
        </span>
      </div>
    </div>
  );
};

export default LiveActivityCounter;

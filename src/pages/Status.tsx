import { useState } from "react";

const integrations = [
  { name: "Search API (eBay Global)", ok: true },
  { name: "Awin Product Feed (Green Spark Plug Co.)", ok: true },
  { name: "Awin Tyre Feed (mytyres.co.uk)", ok: true },
  { name: "Awin Tyre Feed (Tyres UK)", ok: true },
  { name: "EV King Product Feed", ok: true },
  { name: "Supabase Database", ok: true },
  { name: "Stripe Payments", ok: true },
];

const Status = () => {
  const [now, setNow] = useState(() => new Date());

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0a", color: "#ffffff" }}>
      <div className="max-w-2xl mx-auto px-4 py-12">
        <h1
          className="font-display"
          style={{ fontSize: 28, fontWeight: 800, marginBottom: 6, letterSpacing: "-0.01em" }}
        >
          System Status
        </h1>
        <p style={{ color: "#a1a1aa", fontSize: 13, marginBottom: 24 }}>
          Last checked: {now.toLocaleString()}
        </p>

        <ul
          style={{
            background: "#111111",
            border: "1px solid #27272a",
            borderRadius: 12,
            overflow: "hidden",
          }}
        >
          {integrations.map((i, idx) => (
            <li
              key={i.name}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "14px 16px",
                borderTop: idx === 0 ? "none" : "1px solid #1f1f1f",
              }}
            >
              <span style={{ fontSize: 14, color: "#e4e4e7" }}>{i.name}</span>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  fontSize: 12,
                  fontWeight: 600,
                  color: i.ok ? "#86efac" : "#fca5a5",
                }}
              >
                <span style={{ fontSize: 14 }}>{i.ok ? "✅" : "❌"}</span>
                {i.ok ? "Operational" : "Down"}
              </span>
            </li>
          ))}
        </ul>

        <button
          onClick={() => {
            setNow(new Date());
            window.location.reload();
          }}
          style={{
            marginTop: 20,
            background: "#ffffff",
            color: "#0a0a0a",
            fontWeight: 700,
            fontSize: 13,
            padding: "10px 18px",
            borderRadius: 10,
          }}
        >
          Refresh Status
        </button>
      </div>
    </div>
  );
};

export default Status;

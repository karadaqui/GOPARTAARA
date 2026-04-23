import { useState, useEffect } from "react";
import { ArrowUp } from "lucide-react";

const BackToTop = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="Back to top"
      style={{
        position: "fixed",
        bottom: "80px",
        right: "16px",
        width: "44px",
        height: "44px",
        background: "#cc1111",
        color: "white",
        border: "none",
        borderRadius: "50%",
        cursor: "pointer",
        zIndex: 998,
        fontSize: "20px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 4px 16px rgba(204,17,17,0.4)",
        fontWeight: "bold",
      }}
    >
      <ArrowUp size={18} />
    </button>
  );
};

export default BackToTop;

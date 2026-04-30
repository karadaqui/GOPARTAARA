/**
 * UrgencyBar — slim strip pinned above the navbar (homepage Phase 1).
 * Generic copy (no fabricated user names/numbers).
 * Height ~32px — pair with navbar top offset.
 */
const UrgencyBar = () => {
  return (
    <div
      className="ds-urgency-bar fixed top-0 left-0 right-0"
      style={{ zIndex: 51 }}
      role="region"
      aria-label="Live activity"
    >
      <span>
        🔥 <strong>Live</strong> price comparison ·{" "}
        💰 Average savings up to <strong>£43</strong> per part ·{" "}
        ⚡ <strong>7</strong> suppliers checked simultaneously
      </span>
    </div>
  );
};

export default UrgencyBar;

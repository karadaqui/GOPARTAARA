/**
 * UrgencyBar — slim strip above the navbar across the site.
 * Generic copy (no fabricated user names/numbers).
 */
const UrgencyBar = () => {
  return (
    <div className="ds-urgency-bar" role="region" aria-label="Live activity">
      <span>
        🔥 <strong>Live</strong> price comparison ·{" "}
        💰 Average savings up to <strong>£43</strong> per part ·{" "}
        ⚡ <strong>7</strong> suppliers checked simultaneously
      </span>
    </div>
  );
};

export default UrgencyBar;

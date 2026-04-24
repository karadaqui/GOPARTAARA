import { Link } from "react-router-dom";
import type { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  /** Lucide icon — rendered as outline (no fill) at strokeWidth 1.5 */
  icon: LucideIcon;
  iconSize?: number;
  title: string;
  description: string;
  /** Action button — either a route or click handler */
  actionLabel?: string;
  actionTo?: string;
  onAction?: () => void;
  /** "primary" = filled red. "secondary" = ghost outline. */
  variant?: "primary" | "secondary";
}

const EmptyState = ({
  icon: Icon,
  iconSize = 60,
  title,
  description,
  actionLabel,
  actionTo,
  onAction,
  variant = "primary",
}: EmptyStateProps) => {
  const buttonStyle: React.CSSProperties =
    variant === "primary"
      ? {
          background: "#cc1111",
          color: "white",
          border: "1px solid #cc1111",
        }
      : {
          background: "transparent",
          color: "white",
          border: "1px solid #27272a",
        };

  const buttonClass =
    "inline-flex items-center gap-2 rounded-xl transition-opacity hover:opacity-90";
  const buttonInner: React.CSSProperties = {
    height: "44px",
    padding: "0 20px",
    fontSize: "14px",
    fontWeight: 600,
    ...buttonStyle,
  };

  return (
    <div
      className="flex flex-col items-center text-center"
      style={{ padding: "80px 24px" }}
    >
      <Icon
        size={iconSize}
        strokeWidth={1.5}
        className="text-zinc-800"
      />
      <h3
        className="font-display"
        style={{
          fontSize: "20px",
          fontWeight: 700,
          color: "white",
          marginTop: "20px",
          letterSpacing: "-0.01em",
        }}
      >
        {title}
      </h3>
      <p
        style={{
          fontSize: "14px",
          color: "#71717a",
          maxWidth: "300px",
          marginTop: "8px",
          lineHeight: 1.55,
        }}
      >
        {description}
      </p>

      {actionLabel && (actionTo || onAction) && (
        <div style={{ marginTop: "24px" }}>
          {actionTo ? (
            <Link to={actionTo} className={buttonClass} style={buttonInner}>
              {actionLabel}
            </Link>
          ) : (
            <button onClick={onAction} className={buttonClass} style={buttonInner}>
              {actionLabel}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default EmptyState;

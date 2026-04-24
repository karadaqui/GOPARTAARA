import { useState } from "react";
import { Package } from "lucide-react";

interface SafeImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbackClassName?: string;
}

const SafeImage = ({ fallbackClassName, className, alt, style, onLoad, ...props }: SafeImageProps) => {
  const [error, setError] = useState(false);
  const [loaded, setLoaded] = useState(false);

  if (error) {
    return (
      <div
        className={`flex items-center justify-center ${fallbackClassName || className || ""}`}
        style={{ background: "#161616" }}
      >
        <Package className="h-8 w-8 text-zinc-600" />
      </div>
    );
  }

  return (
    <img
      {...props}
      alt={alt || "Image"}
      className={className}
      loading="lazy"
      decoding="async"
      style={{
        background: "#161616",
        opacity: loaded ? 1 : 0,
        transition: "opacity 0.3s ease",
        ...style,
      }}
      onLoad={(e) => {
        setLoaded(true);
        onLoad?.(e);
      }}
      onError={() => setError(true)}
    />
  );
};

export default SafeImage;


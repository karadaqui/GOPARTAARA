import { useState } from "react";
import { Package } from "lucide-react";

interface SafeImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbackClassName?: string;
}

const SafeImage = ({ fallbackClassName, className, alt, ...props }: SafeImageProps) => {
  const [error, setError] = useState(false);

  if (error) {
    return (
      <div className={`flex items-center justify-center bg-zinc-800 ${fallbackClassName || className || ""}`}>
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
      onError={() => setError(true)}
    />
  );
};

export default SafeImage;

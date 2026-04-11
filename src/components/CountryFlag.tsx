import { getTwemojiUrl, useNeedsFlagPolyfill } from "@/contexts/CountryContext";

interface CountryFlagProps {
  countryCode: string;
  emoji: string;
  size?: number;
  className?: string;
}

const CountryFlag = ({ countryCode, emoji, size = 20, className = "" }: CountryFlagProps) => {
  const needsPolyfill = useNeedsFlagPolyfill();

  if (needsPolyfill) {
    return (
      <img
        src={getTwemojiUrl(countryCode)}
        alt={`${countryCode} flag`}
        width={size}
        height={size}
        className={`inline-block ${className}`}
        loading="lazy"
      />
    );
  }

  return <span className={className} style={{ fontSize: size * 0.8 }}>{emoji}</span>;
};

export default CountryFlag;

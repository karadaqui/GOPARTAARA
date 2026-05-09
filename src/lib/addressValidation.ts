// Lightweight address & phone validators used across address forms.

export const UK_POSTCODE_RE = /^[A-Z]{1,2}\d[A-Z\d]? ?\d[A-Z]{2}$/i;

export function isValidUKPostcode(pc: string): boolean {
  return UK_POSTCODE_RE.test(pc.trim());
}

/** Country-aware postcode check. Empty postcode => false. Non-UK => length-only sanity. */
export function isValidPostcode(pc: string, country: string): boolean {
  const v = pc.trim();
  if (!v) return false;
  if (country === "GB" || country === "United Kingdom") return isValidUKPostcode(v);
  return v.length >= 3 && v.length <= 12;
}

/** UK: +44XXXXXXXXXX or 07XXXXXXXXX (10–11 digits). International: 7–15 digits, optional + prefix. */
export function isValidPhone(phone: string, country = "GB"): boolean {
  const raw = phone.trim();
  if (!raw) return false;
  const digits = raw.replace(/[^\d]/g, "");
  if (country === "GB") {
    if (raw.startsWith("+44")) return digits.length >= 12 && digits.length <= 13;
    if (raw.startsWith("0")) return digits.length === 11 && raw.startsWith("07");
    // allow international format too
  }
  return digits.length >= 7 && digits.length <= 15;
}

export function generateOrderNumber(): string {
  // 6-char base32 (no confusing chars)
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 6; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return `GP-${out}`;
}

import { parsePhoneNumber } from "react-phone-number-input";

const fallbackDialCodeMap = [
  { code: "+1", countries: ["US", "CA"] },
  { code: "+44", countries: ["GB"] },
  { code: "+971", countries: ["AE"] },
  { code: "+65", countries: ["SG"] },
  { code: "+61", countries: ["AU"] },
  { code: "+64", countries: ["NZ"] },
  { code: "+91", countries: ["IN"] },
];

export function getCountryFromPhone(value) {
  if (!value || typeof value !== "string") return "";

  try {
    const parsed = parsePhoneNumber(value);
    const country = parsed?.country || "";
    if (country) return String(country).toUpperCase();
  } catch {
    // Fall through to the simple dial-code fallback.
  }

  const match = fallbackDialCodeMap.find((entry) => value.startsWith(entry.code));
  return match ? match.countries[0] : "";
}


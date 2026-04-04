import { isValidPhoneNumber, parsePhoneNumber } from "react-phone-number-input";

const fallbackDialCodeMap = [
  { code: "+1", countries: ["US", "CA"] },
  { code: "+20", countries: ["EG"] },
  { code: "+27", countries: ["ZA"] },
  { code: "+33", countries: ["FR"] },
  { code: "+34", countries: ["ES"] },
  { code: "+39", countries: ["IT"] },
  { code: "+44", countries: ["GB"] },
  { code: "+49", countries: ["DE"] },
  { code: "+60", countries: ["MY"] },
  { code: "+61", countries: ["AU"] },
  { code: "+62", countries: ["ID"] },
  { code: "+64", countries: ["NZ"] },
  { code: "+65", countries: ["SG"] },
  { code: "+66", countries: ["TH"] },
  { code: "+81", countries: ["JP"] },
  { code: "+82", countries: ["KR"] },
  { code: "+91", countries: ["IN"] },
  { code: "+92", countries: ["PK"] },
  { code: "+94", countries: ["LK"] },
  { code: "+212", countries: ["MA"] },
  { code: "+213", countries: ["DZ"] },
  { code: "+216", countries: ["TN"] },
  { code: "+218", countries: ["LY"] },
  { code: "+230", countries: ["MU"] },
  { code: "+234", countries: ["NG"] },
  { code: "+255", countries: ["TZ"] },
  { code: "+256", countries: ["UG"] },
  { code: "+260", countries: ["ZM"] },
  { code: "+263", countries: ["ZW"] },
  { code: "+351", countries: ["PT"] },
  { code: "+353", countries: ["IE"] },
  { code: "+358", countries: ["FI"] },
  { code: "+420", countries: ["CZ"] },
  { code: "+852", countries: ["HK"] },
  { code: "+886", countries: ["TW"] },
  { code: "+971", countries: ["AE"] },
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

export function isAcceptableContactNumber(value) {
  if (!value || typeof value !== "string") return false;

  const normalized = value.replace(/[^\d+]/g, "");
  if (!normalized.startsWith("+")) return false;

  const country = getCountryFromPhone(normalized);
  if (country === "IN") {
    return isValidPhoneNumber(normalized);
  }

  if (country) {
    const digits = normalized.replace(/\D/g, "");
    return digits.length >= 8 && digits.length <= 15;
  }

  try {
    return isValidPhoneNumber(normalized);
  } catch {
    return false;
  }
}

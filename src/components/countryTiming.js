import { getCountries } from "react-phone-number-input";
import en from "react-phone-number-input/locale/en";

const countryGroups = {
  usCanada: new Set(["US", "CA"]),
  ukEurope: new Set([
    "GB",
    "IE",
    "FR",
    "DE",
    "ES",
    "IT",
    "NL",
    "BE",
    "SE",
    "NO",
    "DK",
    "FI",
    "PL",
    "PT",
    "CH",
    "AT",
  ]),
  uae: new Set(["AE", "SA", "QA", "KW", "OM", "BH"]),
  sea: new Set(["SG", "MY", "ID", "TH", "PH", "VN", "KH", "LA", "BN", "MM"]),
  anz: new Set(["AU", "NZ"]),
  indiaSubcontinent: new Set(["IN", "NP", "BD", "PK", "LK"]),
};

const timingSets = {
  india: [
    "Block 1 (IST) - 12:00 PM",
    "Block 2 (IST) - 1:00 PM",
  ],
  sea: [
    "Block 1 (SGT/WIB) - 2:30 PM",
    "Block 2 (SGT/WIB) - 3:30 PM",
  ],
  uae: [
    "Block 1 (GST) - 1:30 PM",
    "Block 2 (GST) - 2:30 PM",
  ],
  europe: [
    "Block 1 (GMT) - 9:30 AM",
    "Block 2 (GMT) - 10:30 AM",
  ],
  usCanada: [
    "Block 1 (ET) - 11:30 AM",
    "Block 1 (CT) - 10:30 AM",
    "Block 1 (MT) - 9:30 AM",
    "Block 1 (PT) - 8:30 AM",
    "Block 2 (ET) - 12:30 PM",
    "Block 2 (CT) - 11:30 AM",
    "Block 2 (MT) - 10:30 AM",
    "Block 2 (PT) - 9:30 AM",
  ],
  anz: [
    "Block 1 (AEST) - 4:30 PM",
    "Block 1 (ACST) - 4:00 PM",
    "Block 1 (AWST) - 2:30 PM",
    "Block 2 (AEST) - 5:30 PM",
    "Block 2 (ACST) - 5:00 PM",
    "Block 2 (AWST) - 3:30 PM",
    "Block 1 (NZDT) - 7:30 PM",
    "Block 2 (NZDT) - 8:30 PM",
  ],
  fallback: [
    "Block 1 - 12:00 PM",
    "Block 2 - 1:00 PM",
  ],
};

export function getTimingOptions(countryCode) {
  if (!countryCode) return [];
  if (countryGroups.usCanada.has(countryCode)) return timingSets.usCanada;
  if (countryGroups.ukEurope.has(countryCode)) return timingSets.europe;
  if (countryGroups.uae.has(countryCode)) return timingSets.uae;
  if (countryGroups.sea.has(countryCode)) return timingSets.sea;
  if (countryGroups.anz.has(countryCode)) return timingSets.anz;
  if (countryGroups.indiaSubcontinent.has(countryCode)) return timingSets.india;
  return timingSets.fallback;
}

export function getTimingTimezoneLabel(countryCode) {
  if (!countryCode) return "Timezone label: Select country to see local times.";
  if (countryGroups.usCanada.has(countryCode)) return "Timezone label: Multiple timezones shown (ET/CT/MT/PT).";
  if (countryGroups.ukEurope.has(countryCode)) return "Timezone label: GMT (London)";
  if (countryGroups.uae.has(countryCode)) return "Timezone label: GST (Dubai)";
  if (countryGroups.sea.has(countryCode)) return "Timezone label: SGT/WIB";
  if (countryGroups.anz.has(countryCode)) return "Timezone label: AEST/ACST/AWST, NZDT";
  if (countryGroups.indiaSubcontinent.has(countryCode)) return "Timezone label: IST";
  return "Timezone label: Local time (selected country).";
}

export const countryOptions = getCountries()
  .map((code) => ({ code, label: en[code] || code }))
  .sort((a, b) => a.label.localeCompare(b.label));

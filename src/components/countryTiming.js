import { getCountries } from "react-phone-number-input";
import en from "react-phone-number-input/locale/en";

const countryGroups = {
  us: new Set(["US"]),
  canada: new Set(["CA"]),
  uk: new Set(["GB"]),
  europe: new Set([
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

const timeZoneMap = {
  us: ["America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles"],
  canada: ["America/Toronto", "America/Winnipeg", "America/Edmonton", "America/Vancouver"],
  uk: ["Europe/London"],
  europe: ["Europe/Berlin"],
  uae: ["Asia/Dubai"],
  sea: ["Asia/Singapore"],
  anz: ["Australia/Sydney", "Australia/Adelaide", "Australia/Perth", "Pacific/Auckland"],
  indiaSubcontinent: ["Asia/Kolkata"],
  fallback: ["UTC"],
};

const timeZoneLabels = {
  "America/New_York": "ET",
  "America/Chicago": "CT",
  "America/Denver": "MT",
  "America/Los_Angeles": "PT",
  "America/Toronto": "ET",
  "America/Winnipeg": "CT",
  "America/Edmonton": "MT",
  "America/Vancouver": "PT",
  "Europe/London": "GMT",
  "Europe/Berlin": "CET",
  "Asia/Dubai": "GST",
  "Asia/Singapore": "SGT",
  "Australia/Sydney": "AEST",
  "Australia/Adelaide": "ACST",
  "Australia/Perth": "AWST",
  "Pacific/Auckland": "NZDT",
  "Asia/Kolkata": "IST",
  UTC: "UTC",
};

function formatHour(hour) {
  const suffix = hour >= 12 ? "PM" : "AM";
  const hour12 = ((hour + 11) % 12) + 1;
  return `${hour12}:00 ${suffix}`;
}

function getZoneLabel(timeZone) {
  return timeZoneLabels[timeZone] || timeZone;
}

function buildSlotsForZone(timeZone) {
  const label = getZoneLabel(timeZone);
  const slots = [];
  for (let hour = 9; hour < 22; hour += 1) {
    slots.push(`${formatHour(hour)} - ${formatHour(hour + 1)} (${label})`);
  }
  return slots;
}

function getTimeZonesForCountry(countryCode) {
  if (countryGroups.us.has(countryCode)) return timeZoneMap.us;
  if (countryGroups.canada.has(countryCode)) return timeZoneMap.canada;
  if (countryGroups.uk.has(countryCode)) return timeZoneMap.uk;
  if (countryGroups.europe.has(countryCode)) return timeZoneMap.europe;
  if (countryGroups.uae.has(countryCode)) return timeZoneMap.uae;
  if (countryGroups.sea.has(countryCode)) return timeZoneMap.sea;
  if (countryGroups.anz.has(countryCode)) return timeZoneMap.anz;
  if (countryGroups.indiaSubcontinent.has(countryCode)) return timeZoneMap.indiaSubcontinent;
  return timeZoneMap.fallback;
}

export function getTimingOptions(countryCode) {
  if (!countryCode) return [];
  const zones = getTimeZonesForCountry(countryCode);
  const options = [];
  zones.forEach((zone) => {
    options.push(...buildSlotsForZone(zone));
  });
  return options;
}

export function getTimingTimezoneLabel(countryCode) {
  if (!countryCode) return "Times shown in local timezone for the selected country.";
  const zones = getTimeZonesForCountry(countryCode);
  if (zones.length <= 1) return `Timezone: ${getZoneLabel(zones[0])}`;
  return `Timezones shown: ${zones.map((zone) => getZoneLabel(zone)).join(" / ")}`;
}

export const countryOptions = getCountries()
  .map((code) => ({ code, label: en[code] || code }))
  .sort((a, b) => a.label.localeCompare(b.label));

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

const IST_ZONE = "Asia/Kolkata";
const IST_OFFSET_MINUTES = 330; // +05:30

function getZoneLabel(timeZone) {
  return timeZoneLabels[timeZone] || timeZone;
}

function getIstDateParts() {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: IST_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = formatter.formatToParts(new Date());
  const lookup = Object.fromEntries(parts.map((p) => [p.type, p.value]));
  return {
    year: Number(lookup.year),
    month: Number(lookup.month),
    day: Number(lookup.day),
    iso: `${lookup.year}-${lookup.month}-${lookup.day}`,
  };
}

function buildIstDateUtc(year, month, day, hour, minute) {
  // Convert IST wall time to UTC by subtracting +05:30
  const totalMinutes = hour * 60 + minute - IST_OFFSET_MINUTES;
  const utcHour = Math.floor(totalMinutes / 60);
  const utcMinute = totalMinutes % 60;
  return new Date(Date.UTC(year, month - 1, day, utcHour, utcMinute, 0));
}

function formatTimeInZone(date, timeZone) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  return formatter.format(date).replace(":00", ":00");
}

function formatDateKey(date, timeZone) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return formatter.format(date);
}

function buildSlotsForZone(timeZone) {
  const label = getZoneLabel(timeZone);
  const slots = [];
  const istDate = getIstDateParts();

  for (let hour = 9; hour < 22; hour += 1) {
    const startUtc = buildIstDateUtc(istDate.year, istDate.month, istDate.day, hour, 0);
    const endUtc = buildIstDateUtc(istDate.year, istDate.month, istDate.day, hour + 1, 0);

    const startLocal = formatTimeInZone(startUtc, timeZone);
    const endLocal = formatTimeInZone(endUtc, timeZone);

    const localDateKey = formatDateKey(startUtc, timeZone);
    const daySuffix = localDateKey === istDate.iso ? "" : localDateKey > istDate.iso ? " (Next day)" : " (Prev day)";

    slots.push(`${startLocal} - ${endLocal} (${label})${daySuffix}`);
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

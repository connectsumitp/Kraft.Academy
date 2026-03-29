const countryGroups = {
  us: new Set(["US"]),
  canada: new Set(["CA"]),
  uk: new Set(["GB"]),
  europe: new Set(["IE", "FR", "DE", "ES", "IT", "NL", "BE", "SE", "NO", "DK", "FI", "PL", "PT", "CH", "AT"]),
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
const IST_OFFSET_MINUTES = 330;
const WEEKDAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const WORKSHOP_WEEKDAY_SET = new Set([5, 6, 0]);
const PROGRAM_WEEKDAY_SET = new Set([6, 0]);
const WORKSHOP_SLOT_HOURS = [19, 20];
const PREFERRED_START_HOUR = 10;
const PREFERRED_END_HOUR = 24;
const WEEKEND_BLOCKED_HOURS = new Set([19, 20]);
const MAX_PREFERRED_BOOKING_DAYS = 7;

function normalizeBlockedItems(items) {
  return Array.isArray(items) ? items : [];
}

function getZoneLabel(timeZone) {
  return timeZoneLabels[timeZone] || timeZone;
}

function getDatePartsInTimeZone(date, timeZone) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const lookup = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return {
    year: Number(lookup.year),
    month: Number(lookup.month),
    day: Number(lookup.day),
    iso: `${lookup.year}-${lookup.month}-${lookup.day}`,
  };
}

function parseIsoDateParts(isoDate) {
  const [year, month, day] = String(isoDate).split("-").map(Number);
  return { year, month, day };
}

function buildUtcFromIst(isoDate, hour, minute = 0) {
  const { year, month, day } = parseIsoDateParts(isoDate);
  const totalMinutes = hour * 60 + minute - IST_OFFSET_MINUTES;
  const utcHour = Math.floor(totalMinutes / 60);
  const utcMinute = ((totalMinutes % 60) + 60) % 60;
  return new Date(Date.UTC(year, month - 1, day, utcHour, utcMinute, 0));
}

function addDaysToIsoDate(isoDate, days) {
  const { year, month, day } = parseIsoDateParts(isoDate);
  const utcDate = new Date(Date.UTC(year, month - 1, day + days, 12, 0, 0));
  return utcDate.toISOString().slice(0, 10);
}

function formatDateKey(date, timeZone) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function formatLongDateInIst(isoDate) {
  const { year, month, day } = parseIsoDateParts(isoDate);
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: IST_ZONE,
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(Date.UTC(year, month - 1, day, 12, 0, 0)));
}

function formatTimeInZone(date, timeZone) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

function getIstWeekday(isoDate) {
  const { year, month, day } = parseIsoDateParts(isoDate);
  return new Date(Date.UTC(year, month - 1, day, 12, 0, 0)).getUTCDay();
}

function isWorkshopWeekday(isoDate) {
  return WORKSHOP_WEEKDAY_SET.has(getIstWeekday(isoDate));
}

function getPreferredAllowedHours(isoDate) {
  const hours = [];
  const isWorkshopDay = isWorkshopWeekday(isoDate);
  for (let hour = PREFERRED_START_HOUR; hour < PREFERRED_END_HOUR; hour += 1) {
    if (isWorkshopDay && WEEKEND_BLOCKED_HOURS.has(hour)) continue;
    hours.push(hour);
  }
  return hours;
}

function parseBlockedHour(slot) {
  const raw = String(slot || "").trim();
  if (!raw) return null;
  const withoutPrefix = raw.includes("|") ? raw.split("|").pop().trim() : raw;
  const firstLabel = withoutPrefix.split(" - ")[0]?.trim();
  const match = firstLabel && firstLabel.match(/^(\d{1,2}):(\d{2})\s(AM|PM)$/i);
  if (!match) return null;

  let hour = Number(match[1]);
  const meridiem = match[3].toUpperCase();
  if (meridiem === "PM" && hour !== 12) hour += 12;
  if (meridiem === "AM" && hour === 12) hour = 0;
  return hour;
}

function isDateBlocked(items, bookingType, isoDate) {
  return normalizeBlockedItems(items).some(
    (item) =>
      item?.bookingType === bookingType &&
      item?.date === isoDate &&
      item?.status === "blocked" &&
      String(item?.slot || "").trim().toLowerCase() === "all"
  );
}

function getBlockedHours(items, bookingType, isoDate) {
  return new Set(
    normalizeBlockedItems(items)
      .filter(
        (item) =>
          item?.bookingType === bookingType &&
          item?.date === isoDate &&
          item?.status === "blocked" &&
          String(item?.slot || "").trim().toLowerCase() !== "all"
      )
      .map((item) => parseBlockedHour(item.slot))
      .filter((hour) => Number.isFinite(hour))
  );
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

function extractDisplayedTimeLabel(option) {
  const withoutZone = option.split(" (")[0];
  return withoutZone.includes(" | ") ? withoutZone.split(" | ").pop() : withoutZone;
}

function getSortValue(option) {
  const timeLabel = extractDisplayedTimeLabel(option);
  const [startLabel] = timeLabel.split(" - ");
  const match = startLabel.match(/^(\d{1,2}):(\d{2})\s(AM|PM)$/i);
  if (!match) return Number.MAX_SAFE_INTEGER;

  let hour = Number(match[1]);
  const minute = Number(match[2]);
  const meridiem = match[3].toUpperCase();

  if (meridiem === "PM" && hour !== 12) hour += 12;
  if (meridiem === "AM" && hour === 12) hour = 0;

  return hour * 60 + minute;
}

function sortByDisplayedStart(left, right) {
  return getSortValue(left) - getSortValue(right);
}

function getUpcomingDatesForWeekdays(weekdaySet, count) {
  const todayIso = getDatePartsInTimeZone(new Date(), IST_ZONE).iso;
  const results = [];

  for (let offset = 0; results.length < count && offset < 21; offset += 1) {
    const isoDate = addDaysToIsoDate(todayIso, offset);
    const weekdayIndex = getIstWeekday(isoDate);
    if (!weekdaySet.has(weekdayIndex)) continue;

    results.push({
      isoDate,
      weekdayIndex,
      weekdayLabel: WEEKDAY_NAMES[weekdayIndex],
      longDate: formatLongDateInIst(isoDate),
    });
  }

  return results;
}

export function getPreferredDateBounds() {
  const min = getDatePartsInTimeZone(new Date(), IST_ZONE).iso;
  const max = addDaysToIsoDate(min, MAX_PREFERRED_BOOKING_DAYS - 1);
  return { min, max };
}

export function getUpcomingWorkshopDays(count = 3) {
  return getUpcomingDatesForWeekdays(WORKSHOP_WEEKDAY_SET, count);
}

export function getWorkshopGroupSlots(blockedItems = []) {
  const now = new Date();
  return getUpcomingWorkshopDays().map((day) => ({
    ...day,
    slots: WORKSHOP_SLOT_HOURS
      .filter((hour) => !isDateBlocked(blockedItems, "workshop", day.isoDate))
      .filter((hour) => !getBlockedHours(blockedItems, "workshop", day.isoDate).has(hour))
      .map((hour) => {
        const startUtc = buildUtcFromIst(day.isoDate, hour, 0);
        const endUtc = buildUtcFromIst(day.isoDate, hour + 1, 0);
        return {
          slotKey: `${day.isoDate}|${hour}`,
          isoDate: day.isoDate,
          weekdayLabel: day.weekdayLabel,
          longDate: day.longDate,
          time: `${formatTimeInZone(startUtc, IST_ZONE)} - ${formatTimeInZone(endUtc, IST_ZONE)} (IST)`,
          isClosedForTime: startUtc <= now,
        };
      }),
  })).filter((day) => day.slots.length > 0);
}

export function getPreferredTimingOptions(countryCode, selectedDate, blockedItems = []) {
  if (!countryCode || !selectedDate) return [];
  if (isDateBlocked(blockedItems, "preferred", selectedDate)) return [];

  const zones = getTimeZonesForCountry(countryCode);
  const options = [];
  const candidateIstDates = [addDaysToIsoDate(selectedDate, -1), selectedDate, addDaysToIsoDate(selectedDate, 1)];

  candidateIstDates.forEach((istIsoDate) => {
    const blockedHours = getBlockedHours(blockedItems, "preferred", istIsoDate);
    getPreferredAllowedHours(istIsoDate).forEach((hour) => {
      if (blockedHours.has(hour)) return;
      const startUtc = buildUtcFromIst(istIsoDate, hour, 0);
      const endUtc = buildUtcFromIst(istIsoDate, hour + 1, 0);

      zones.forEach((zone) => {
        if (formatDateKey(startUtc, zone) !== selectedDate) return;
        const option = `${formatTimeInZone(startUtc, zone)} - ${formatTimeInZone(endUtc, zone)} (${getZoneLabel(zone)})`;
        if (!options.includes(option)) {
          options.push(option);
        }
      });
    });
  });

  return options.sort(sortByDisplayedStart);
}

export function getProgramTimingOptions(countryCode, blockedItems = []) {
  if (!countryCode) return [];

  const zones = getTimeZonesForCountry(countryCode);
  const options = [];
  const weekendDates = getUpcomingDatesForWeekdays(PROGRAM_WEEKDAY_SET, 2);

  weekendDates.forEach((day) => {
    if (isDateBlocked(blockedItems, "program", day.isoDate)) return;
    const blockedHours = getBlockedHours(blockedItems, "program", day.isoDate);
    getPreferredAllowedHours(day.isoDate).forEach((hour) => {
      if (blockedHours.has(hour)) return;
      const startUtc = buildUtcFromIst(day.isoDate, hour, 0);
      const endUtc = buildUtcFromIst(day.isoDate, hour + 1, 0);

      zones.forEach((zone) => {
        const option = `${day.weekdayLabel} | ${formatTimeInZone(startUtc, zone)} - ${formatTimeInZone(endUtc, zone)} (${getZoneLabel(zone)})`;
        if (!options.includes(option)) {
          options.push(option);
        }
      });
    });
  });

  return options.sort(sortByDisplayedStart);
}

export function isAvailabilityDateBlocked(bookingType, isoDate, blockedItems = []) {
  return isDateBlocked(blockedItems, bookingType, isoDate);
}

export function getTimingTimezoneLabel(countryCode, selectedDate, mode = "preferred") {
  if (!countryCode) return "Times shown in local timezone for the selected country.";
  const zones = getTimeZonesForCountry(countryCode);
  const zoneText = zones.length <= 1 ? getZoneLabel(zones[0]) : zones.map((zone) => getZoneLabel(zone)).join(" / ");

  if (mode === "program") {
    return `Weekend timings shown in ${zoneText}. Program hours are 10 AM to 12 midnight IST, excluding 7 PM and 8 PM.`;
  }

  if (selectedDate) {
    return `Times shown for ${selectedDate} in ${zoneText}. Preferred bookings are limited to the next 7 days.`;
  }

  return `Times shown in ${zoneText}.`;
}

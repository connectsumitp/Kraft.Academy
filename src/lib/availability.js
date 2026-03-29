import { availabilityOverrides } from "../config/availabilityOverrides";

function normalizeSlotLabel(slot) {
  return String(slot || "").trim();
}

function normalizeDateValue(value) {
  return String(value || "").trim();
}

function flattenOverrides() {
  const items = [];

  Object.entries(availabilityOverrides || {}).forEach(([bookingType, dateMap]) => {
    Object.entries(dateMap || {}).forEach(([date, slotValue]) => {
      if (slotValue === "all") {
        items.push({
          date: normalizeDateValue(date),
          bookingType: String(bookingType || "").trim().toLowerCase(),
          slot: "all",
          status: "blocked",
          note: "frontend override",
        });
        return;
      }

      (Array.isArray(slotValue) ? slotValue : []).forEach((slot) => {
        items.push({
          date: normalizeDateValue(date),
          bookingType: String(bookingType || "").trim().toLowerCase(),
          slot: normalizeSlotLabel(slot),
          status: "blocked",
          note: "frontend override",
        });
      });
    });
  });

  return items;
}

export async function fetchAvailability() {
  return flattenOverrides();
}

export function isDateFullyBlocked(items, bookingType, isoDate) {
  return items.some(
    (item) => item.bookingType === bookingType && item.date === isoDate && item.status === "blocked" && item.slot.toLowerCase() === "all"
  );
}

export function getBlockedSlotsForDate(items, bookingType, isoDate) {
  return items
    .filter((item) => item.bookingType === bookingType && item.date === isoDate && item.status === "blocked" && item.slot.toLowerCase() !== "all")
    .map((item) => item.slot);
}

import { availabilityOverrides } from "../config/availabilityOverrides";

function normalizeSlotLabel(slot) {
  return String(slot || "").trim();
}

function normalizeDateValue(value) {
  return String(value || "").trim();
}

function flattenOverrides() {
  const items = [];

  Object.entries(availabilityOverrides || {}).forEach(([bookingType, config]) => {
    const normalizedBookingType = String(bookingType || "").trim().toLowerCase();
    const blockedDates = Array.isArray(config?.blockedDates) ? config.blockedDates : [];
    const blockedSlots = config?.blockedSlots && typeof config.blockedSlots === "object" ? config.blockedSlots : {};

    blockedDates.forEach((date) => {
      items.push({
        date: normalizeDateValue(date),
        bookingType: normalizedBookingType,
        slot: "all",
        status: "blocked",
        note: "frontend override",
      });
    });

    Object.entries(blockedSlots).forEach(([date, slotList]) => {
      (Array.isArray(slotList) ? slotList : []).forEach((slot) => {
        items.push({
          date: normalizeDateValue(date),
          bookingType: normalizedBookingType,
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

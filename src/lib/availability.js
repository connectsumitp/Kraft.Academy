function normalizeSlotLabel(slot) {
  return String(slot || "").trim();
}

export async function fetchAvailability() {
  try {
    const response = await fetch("/api/availability");

    const data = await response.json();
    if (!response.ok || !data?.ok || !Array.isArray(data.items)) {
      return [];
    }

    return data.items.map((item) => ({
      date: String(item.date || "").trim(),
      bookingType: String(item.booking_type || "").trim().toLowerCase(),
      slot: normalizeSlotLabel(item.slot),
      status: String(item.status || "").trim().toLowerCase(),
      note: String(item.note || "").trim(),
    }));
  } catch {
    return [];
  }
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

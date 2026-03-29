function normalizeSlotLabel(slot) {
  return String(slot || "").trim();
}

function normalizeDateValue(value) {
  if (!value) return "";

  if (typeof value === "string") {
    const raw = value.trim();
    const isoMatch = raw.match(/^(\d{4}-\d{2}-\d{2})/);
    if (isoMatch) return isoMatch[1];

    const partsMatch = raw.match(/^(?:[A-Za-z]{3}\s)?([A-Za-z]{3})\s(\d{1,2})\s(\d{4})/);
    if (partsMatch) {
      const monthMap = {
        Jan: "01",
        Feb: "02",
        Mar: "03",
        Apr: "04",
        May: "05",
        Jun: "06",
        Jul: "07",
        Aug: "08",
        Sep: "09",
        Oct: "10",
        Nov: "11",
        Dec: "12",
      };
      const month = monthMap[partsMatch[1]];
      const day = String(partsMatch[2]).padStart(2, "0");
      const year = partsMatch[3];
      if (month) return `${year}-${month}-${day}`;
    }

    return raw;
  }

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(value);
  }

  return String(value).trim();
}

export async function fetchAvailability() {
  try {
    const response = await fetch(`/api/availability?t=${Date.now()}`, {
      cache: "no-store",
      headers: {
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
      },
    });

    const data = await response.json();
    if (!response.ok || !data?.ok || !Array.isArray(data.items)) {
      return [];
    }

    return data.items.map((item) => ({
      date: normalizeDateValue(item.date),
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

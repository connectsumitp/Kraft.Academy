const STORAGE_KEY = "ka_local_workshop_seats";
const DEFAULT_SEATS = 15;

function readLocalSeats() {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}

function writeLocalSeats(seats) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seats));
}

function normalizeSeatMap(slotKeys, seats) {
  const result = {};
  slotKeys.forEach((slotKey) => {
    const value = Number(seats?.[slotKey]);
    result[slotKey] = Number.isFinite(value) ? Math.max(0, value) : DEFAULT_SEATS;
  });
  return result;
}

export async function fetchWorkshopSeats(slotKeys) {
  const localSeats = normalizeSeatMap(slotKeys, readLocalSeats());
  const scriptUrl = import.meta.env.VITE_WORKSHOP_SEAT_SCRIPT_URL;

  if (!scriptUrl) {
    return localSeats;
  }

  try {
    const response = await fetch(scriptUrl, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ action: "get_workshop_seats", slot_keys: slotKeys }),
    });

    const data = await response.json();
    if (!response.ok || !data?.ok) {
      return localSeats;
    }

    const merged = normalizeSeatMap(slotKeys, data.seats || {});
    writeLocalSeats(merged);
    return merged;
  } catch {
    return localSeats;
  }
}

export async function confirmWorkshopSeat(slotKey) {
  if (!slotKey || typeof window === "undefined") return DEFAULT_SEATS;

  const localSeats = readLocalSeats();
  const current = Number(localSeats[slotKey]);
  const nextLocal = Number.isFinite(current) ? Math.max(0, current - 1) : DEFAULT_SEATS - 1;
  localSeats[slotKey] = nextLocal;
  writeLocalSeats(localSeats);

  const scriptUrl = import.meta.env.VITE_WORKSHOP_SEAT_SCRIPT_URL;
  if (!scriptUrl) {
    return nextLocal;
  }

  try {
    const response = await fetch(scriptUrl, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ action: "confirm_workshop_seat", slot_key: slotKey }),
    });

    const data = await response.json();
    if (!response.ok || !data?.ok || typeof data.seats_left !== "number") {
      return nextLocal;
    }

    localSeats[slotKey] = Math.max(0, data.seats_left);
    writeLocalSeats(localSeats);
    return localSeats[slotKey];
  } catch {
    return nextLocal;
  }
}

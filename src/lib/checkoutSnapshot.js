const CHECKOUT_SNAPSHOT_KEY = "ka_checkout_snapshot";
const CHECKOUT_SESSION_KEY = "ka_checkout_session_ready";
const CHECKOUT_PAGE_ID_KEY = "ka_checkout_page_id";
const SNAPSHOT_MAX_AGE_MS = 1000 * 60 * 90;

export function getEmptyCheckoutSnapshot() {
  return {
    ready: false,
    flow: "",
    country: "",
    contact: "",
    demoSlot: "",
    workshopSlotKey: "",
  };
}

export function getCurrentCheckoutPageId() {
  if (typeof window === "undefined") return "";

  let pageId = window.sessionStorage.getItem(CHECKOUT_PAGE_ID_KEY);
  if (!pageId) {
    pageId = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    window.sessionStorage.setItem(CHECKOUT_PAGE_ID_KEY, pageId);
  }

  return pageId;
}

export function readCheckoutSnapshot() {
  if (typeof window === "undefined") {
    return getEmptyCheckoutSnapshot();
  }

  const raw = window.localStorage.getItem(CHECKOUT_SNAPSHOT_KEY);
  if (!raw) return getEmptyCheckoutSnapshot();

  try {
    const parsed = JSON.parse(raw);
    const isFresh =
      Boolean(parsed?.ready) &&
      Number.isFinite(Number(parsed?.updatedAt)) &&
      Date.now() - Number(parsed.updatedAt) <= SNAPSHOT_MAX_AGE_MS;
    const isCurrentPage = parsed?.pageId === getCurrentCheckoutPageId();

    return {
      ready: isFresh && isCurrentPage,
      flow: parsed?.flow || "",
      country: parsed?.country || "",
      contact: parsed?.contact || "",
      demoSlot: parsed?.demoSlot || "",
      workshopSlotKey: parsed?.workshopSlotKey || "",
    };
  } catch {
    return getEmptyCheckoutSnapshot();
  }
}

export function writeCheckoutSnapshot(snapshot) {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(
    CHECKOUT_SNAPSHOT_KEY,
    JSON.stringify({
      ...snapshot,
      updatedAt: Date.now(),
      pageId: getCurrentCheckoutPageId(),
    })
  );
  window.sessionStorage.setItem(CHECKOUT_SESSION_KEY, "1");
}

export function clearCheckoutSnapshot() {
  if (typeof window === "undefined") return;

  window.localStorage.removeItem(CHECKOUT_SNAPSHOT_KEY);
  window.sessionStorage.removeItem(CHECKOUT_SESSION_KEY);
}

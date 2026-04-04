import { useEffect, useMemo, useState } from "react";
import { confirmWorkshopSeat } from "../lib/workshopSeats";

const fallbackRates = {
  INR: 1,
  USD: 0.012,
  EUR: 0.011,
  GBP: 0.01,
  AED: 0.044,
  SGD: 0.016,
  AUD: 0.019,
  NZD: 0.02,
  CAD: 0.016,
};

const euroCountries = new Set(["AT", "BE", "CY", "DE", "EE", "ES", "FI", "FR", "GR", "HR", "IE", "IT", "LT", "LU", "LV", "MT", "NL", "PT", "SI", "SK"]);
const countryCurrencyMap = {
  IN: "INR",
  US: "USD",
  CA: "CAD",
  GB: "GBP",
  AE: "AED",
  SG: "SGD",
  AU: "AUD",
  NZ: "NZD",
};

const CHECKOUT_SNAPSHOT_KEY = "ka_checkout_snapshot";
const CHECKOUT_SESSION_KEY = "ka_checkout_session_ready";
const SNAPSHOT_MAX_AGE_MS = 1000 * 60 * 90;

function getCurrencyForCountry(countryCode) {
  if (!countryCode) return "USD";
  if (countryCurrencyMap[countryCode]) return countryCurrencyMap[countryCode];
  if (euroCountries.has(countryCode)) return "EUR";
  return "USD";
}

function formatMoney(value, currency) {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return `${currency} ${Math.round(value)}`;
  }
}

function formatMoneyWithCode(value, currency) {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      currencyDisplay: "code",
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return `${currency} ${Math.round(value)}`;
  }
}

function getConvertedAmount(value) {
  if (!Number.isFinite(value)) return value;
  if (value <= 0) return 0;
  return Math.max(1, Math.round(value));
}

function getSubunitFactor(currency) {
  const zeroDecimal = new Set(["JPY", "KRW", "VND"]);
  return zeroDecimal.has(currency) ? 1 : 100;
}

function getEmptySnapshot() {
  return {
    ready: false,
    flow: "",
    country: "",
    contact: "",
    demoSlot: "",
    workshopSlotKey: "",
  };
}

function readCheckoutSnapshot() {
  if (typeof window === "undefined") {
    return getEmptySnapshot();
  }

  const raw = window.localStorage.getItem(CHECKOUT_SNAPSHOT_KEY);
  if (!raw) return getEmptySnapshot();

  try {
    const parsed = JSON.parse(raw);
    return {
      ready:
        Boolean(parsed?.ready) &&
        Number.isFinite(Number(parsed?.updatedAt)) &&
        Date.now() - Number(parsed.updatedAt) <= SNAPSHOT_MAX_AGE_MS,
      flow: parsed?.flow || "",
      country: parsed?.country || "",
      contact: parsed?.contact || "",
      demoSlot: parsed?.demoSlot || "",
      workshopSlotKey: parsed?.workshopSlotKey || "",
    };
  } catch {
    return getEmptySnapshot();
  }
}

function writeCheckoutSnapshot(snapshot) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    CHECKOUT_SNAPSHOT_KEY,
    JSON.stringify({
      ...snapshot,
      updatedAt: Date.now(),
    })
  );
  window.sessionStorage.setItem(CHECKOUT_SESSION_KEY, "1");
}

function clearCheckoutSnapshot() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(CHECKOUT_SNAPSHOT_KEY);
  window.sessionStorage.removeItem(CHECKOUT_SESSION_KEY);
}

function loadRazorpayScript() {
  if (typeof window === "undefined") return Promise.resolve(false);
  if (window.Razorpay) return Promise.resolve(true);
  const existing = document.querySelector("script[data-razorpay]");
  if (existing) {
    return new Promise((resolve) => {
      existing.addEventListener("load", () => resolve(true));
      existing.addEventListener("error", () => resolve(false));
    });
  }
  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.dataset.razorpay = "true";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

function getPrefill() {
  if (typeof window === "undefined") return {};
  return {
    name: window.localStorage.getItem("ka_name") || "",
    email: window.localStorage.getItem("ka_email") || "",
    contact: window.localStorage.getItem("ka_contact") || "",
  };
}

function getLeadDetails() {
  if (typeof window === "undefined") return {};
  return {
    name: window.localStorage.getItem("ka_name") || "",
    email: window.localStorage.getItem("ka_email") || "",
    contact: window.localStorage.getItem("ka_contact") || "",
    age: window.localStorage.getItem("ka_age") || "",
    country: window.localStorage.getItem("ka_country") || "",
    date: window.localStorage.getItem("ka_date") || "",
    timing: window.localStorage.getItem("ka_timing") || "",
    program: window.localStorage.getItem("ka_program") || "",
  };
}

async function readJsonResponse(response) {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(text);
  }
}

async function sendConfirmationEmail(emailScriptUrl, purpose) {
  const lead = getLeadDetails();
  await fetch(emailScriptUrl, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({
      action: "send_confirmation",
      purpose,
      name: lead.name,
      email: lead.email,
      contact: lead.contact,
      age: lead.age,
      country: lead.country,
      date: lead.date,
      timing: lead.timing,
      program: lead.program,
    }),
  });
}

export default function PricingSection() {
  const [checkoutSnapshot, setCheckoutSnapshot] = useState(getEmptySnapshot);
  const [rates, setRates] = useState(fallbackRates);
  const [rateSource, setRateSource] = useState("fallback");
  const [checkoutStatus, setCheckoutStatus] = useState("");
  const [isHighlighted, setIsHighlighted] = useState(false);
  const [highlightedCard, setHighlightedCard] = useState("");
  const [isPayPalProcessing, setIsPayPalProcessing] = useState(false);
  const [isGatewayBusy, setIsGatewayBusy] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const syncSnapshot = () => {
      setCheckoutSnapshot(readCheckoutSnapshot());
    };

    const clearSnapshot = () => {
      clearCheckoutSnapshot();
      setCheckoutSnapshot(getEmptySnapshot());
    };

    const applySnapshot = (event) => {
      const detail = event?.detail || {};
      const nextSnapshot = {
        ready: true,
        flow: detail.flow || "",
        country: detail.country || "",
        contact: detail.contact || "",
        demoSlot: detail.demoSlot || "",
        workshopSlotKey: detail.workshopSlotKey || "",
        updatedAt: Date.now(),
      };
      writeCheckoutSnapshot(nextSnapshot);
      setCheckoutSnapshot(nextSnapshot);
    };

    syncSnapshot();

    window.addEventListener("ka-demo-slot-change", syncSnapshot);
    window.addEventListener("ka-workshop-slot-key-change", syncSnapshot);
    window.addEventListener("ka-checkout-invalidate", clearSnapshot);
    window.addEventListener("ka-checkout-snapshot", applySnapshot);
    window.addEventListener("ka-checkout-ready", syncSnapshot);

    return () => {
      window.removeEventListener("ka-demo-slot-change", syncSnapshot);
      window.removeEventListener("ka-workshop-slot-key-change", syncSnapshot);
      window.removeEventListener("ka-checkout-invalidate", clearSnapshot);
      window.removeEventListener("ka-checkout-snapshot", applySnapshot);
      window.removeEventListener("ka-checkout-ready", syncSnapshot);
    };
  }, []);

  useEffect(() => {
    const onHighlight = () => {
      setIsHighlighted(true);
      window.setTimeout(() => setIsHighlighted(false), 2000);
    };
    const onCardHighlight = (event) => {
      const purpose = event?.detail?.purpose || "";
      setHighlightedCard(purpose);
      window.setTimeout(() => setHighlightedCard(""), 2200);
    };
    if (typeof window !== "undefined") {
      window.addEventListener("ka-razorpay-focus", onHighlight);
      window.addEventListener("ka-razorpay-card-focus", onCardHighlight);
    }
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("ka-razorpay-focus", onHighlight);
        window.removeEventListener("ka-razorpay-card-focus", onCardHighlight);
      }
    };
  }, []);

  useEffect(() => {
    let active = true;
    const loadRates = async () => {
      try {
        const response = await fetch("https://open.er-api.com/v6/latest/INR");
        if (!response.ok) throw new Error("rates_fetch_failed");
        const data = await response.json();
        if (active && data?.rates) {
          setRates((prev) => ({ ...prev, ...data.rates }));
          setRateSource("live");
        }
      } catch {
        if (active) {
          setRateSource("fallback");
        }
      }
    };
    loadRates();
    return () => {
      active = false;
    };
  }, []);

  const checkoutReady = checkoutSnapshot.ready;
  const country = checkoutSnapshot.country;
  const demoSlot = checkoutSnapshot.demoSlot;
  const workshopSlotKey = checkoutSnapshot.workshopSlotKey;
  const inferredRegion = country === "IN" ? "IN" : country ? "GLOBAL" : "GLOBAL";
  const effectiveCountry = country;
  const displayCurrency = useMemo(() => {
    if (inferredRegion === "IN") return "INR";
    if (country && country !== "IN") return getCurrencyForCountry(country);
    return "USD";
  }, [country, inferredRegion]);
  const canShowCheckout = checkoutReady;
  const recommendedGateway = inferredRegion === "IN" ? "Razorpay" : "PayPal";
  const checkoutHint = !checkoutReady
    ? demoSlot
      ? "Add a valid Indian contact number to unlock this workshop payment."
      : "Complete one of the booking flows above to unlock your checkout."
    : `Checkout is unlocked. ${recommendedGateway} is the most reliable option for this booking right now.`;
  const lockedWorkshopHint = demoSlot
    ? "Choose this India workshop route with a valid Indian contact number to reveal the Rs 99 payment."
    : "Complete either the group workshop or 1:1 / global demo booking above to reveal your workshop payment.";
  const lockedProgramHint = "Open the program enrollment section, add your details, and continue to reveal the program payment.";

  const workshopGroupInr = Number(import.meta.env.VITE_WORKSHOP_GROUP_INR || 99);
  const workshopIndiaOneToOneInr = Number(import.meta.env.VITE_WORKSHOP_11_INDIA_INR || 499);
  const workshopGlobalInr = Number(import.meta.env.VITE_WORKSHOP_GLOBAL_INR || 1000);
  const programInr = Number(import.meta.env.VITE_PROGRAM_AMOUNT_INR || 0);
  const programGlobalInr = Number(import.meta.env.VITE_PROGRAM_GLOBAL_INR || 0);
  const paypalGlobalCurrency = "USD";
  const orderScriptUrl = import.meta.env.VITE_RAZORPAY_ORDER_SCRIPT_URL || "/api/razorpay-order";
  const emailScriptUrl = import.meta.env.VITE_RAZORPAY_EMAIL_SCRIPT_URL || orderScriptUrl;

  const pricingInfo = useMemo(() => {
    if (inferredRegion === "IN") {
      const indiaWorkshopAmount = demoSlot ? workshopGroupInr : workshopIndiaOneToOneInr;
      return {
        label: formatMoney(indiaWorkshopAmount, "INR"),
        amount: indiaWorkshopAmount,
        currency: "INR",
        baseInr: indiaWorkshopAmount,
      };
    }

    const fx = rates[displayCurrency] || fallbackRates[displayCurrency] || 1;
    const converted = workshopGlobalInr * fx;
    const rounded = getConvertedAmount(converted);
    return {
      label: formatMoney(rounded, displayCurrency),
      amount: rounded,
      currency: displayCurrency,
      raw: converted,
      baseInr: workshopGlobalInr,
    };
  }, [inferredRegion, displayCurrency, rates, demoSlot, workshopGroupInr, workshopIndiaOneToOneInr, workshopGlobalInr]);

  const programPricing = useMemo(() => {
    const baseInr = inferredRegion === "IN" ? programInr : programGlobalInr;
    if (!baseInr) {
      return { label: "Set program price", amount: 0, currency: inferredRegion === "IN" ? "INR" : displayCurrency };
    }
    if (inferredRegion === "IN") {
      return {
        label: formatMoney(baseInr, "INR"),
        amount: baseInr,
        currency: "INR",
        baseInr,
      };
    }
    const fx = rates[displayCurrency] || fallbackRates[displayCurrency] || 1;
    const converted = baseInr * fx;
    const rounded = getConvertedAmount(converted);
    return {
      label: formatMoney(rounded, displayCurrency),
      amount: rounded,
      currency: displayCurrency,
      raw: converted,
      baseInr,
    };
  }, [programInr, programGlobalInr, inferredRegion, displayCurrency, rates]);

  const paypalWorkshopPricing = useMemo(() => {
    if (inferredRegion === "IN") return null;
    const usdRate = rates[paypalGlobalCurrency] || fallbackRates[paypalGlobalCurrency] || 1;
    const converted = (pricingInfo.baseInr || 0) * usdRate;
    const rounded = getConvertedAmount(converted);
    return {
      label: formatMoney(rounded, paypalGlobalCurrency),
      amount: rounded,
    };
  }, [inferredRegion, paypalGlobalCurrency, pricingInfo.baseInr, rates]);

  const paypalProgramPricing = useMemo(() => {
    if (inferredRegion === "IN") return null;
    const usdRate = rates[paypalGlobalCurrency] || fallbackRates[paypalGlobalCurrency] || 1;
    const converted = (programPricing.baseInr || 0) * usdRate;
    const rounded = getConvertedAmount(converted);
    return {
      label: formatMoney(rounded, paypalGlobalCurrency),
      amount: rounded,
    };
  }, [inferredRegion, paypalGlobalCurrency, programPricing.baseInr, rates]);

  const showOnlyWorkshopCheckout = canShowCheckout && checkoutSnapshot.flow === "workshop";
  const showOnlyProgramCheckout = canShowCheckout && checkoutSnapshot.flow === "program";
  const showWorkshopCard = !canShowCheckout || showOnlyWorkshopCheckout;
  const showProgramCard = !canShowCheckout || showOnlyProgramCheckout;
  const checkoutGridClass = showWorkshopCard && showProgramCard ? "xl:grid-cols-2" : "max-w-3xl";
  const workshopCheckoutLabel =
    inferredRegion === "GLOBAL" && paypalWorkshopPricing?.label ? paypalWorkshopPricing.label : pricingInfo.label;
  const programCheckoutLabel =
    inferredRegion === "GLOBAL" && paypalProgramPricing?.label ? paypalProgramPricing.label : programPricing.label;

  const confirmWorkshopSeatIfNeeded = async (purpose) => {
    if (typeof window === "undefined") return;
    if (purpose !== "workshop" || !workshopSlotKey) return;
    const guardKey = `ka_seat_confirmed_${workshopSlotKey}`;
    if (window.sessionStorage.getItem(guardKey)) return;
    const seatsLeft = await confirmWorkshopSeat(workshopSlotKey);
    window.sessionStorage.setItem(guardKey, "1");
    window.dispatchEvent(new CustomEvent("ka-workshop-seat-update", { detail: { slotKey: workshopSlotKey, seatsLeft } }));
  };

  const completeSuccessfulPayment = async (purpose) => {
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem("ka_last_payment", purpose);
      window.location.hash = "#thank-you";
    }
    await confirmWorkshopSeatIfNeeded(purpose);
    try {
      await sendConfirmationEmail(emailScriptUrl, purpose);
    } catch {
      // ignore email failures for now
    }
    setCheckoutStatus("Payment successful. We will contact you shortly.");
  };

  useEffect(() => {
    if (typeof window === "undefined") return;

    const url = new URL(window.location.href);
    const isPayPalReturn = url.searchParams.get("paypal_return") === "1";
    const orderId = url.searchParams.get("token");
    const purpose = url.searchParams.get("paypal_purpose") || "workshop";

    if (!isPayPalReturn || !orderId || isPayPalProcessing) {
      return;
    }

    let active = true;

    const capturePayPalOrder = async () => {
      setIsPayPalProcessing(true);
      setCheckoutStatus("Finalizing your PayPal payment...");
      try {
        const response = await fetch("/api/paypal-capture", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId }),
        });

        const data = await readJsonResponse(response);
        if (!response.ok || !data?.ok) {
          throw new Error(data?.error || "PayPal payment could not be verified.");
        }

        if (!active) return;
        await completeSuccessfulPayment(purpose);

        url.searchParams.delete("paypal_return");
        url.searchParams.delete("paypal_purpose");
        url.searchParams.delete("token");
        url.searchParams.delete("PayerID");
        window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash || "#thank-you"}`);
      } catch (error) {
        if (!active) return;
        setCheckoutStatus(error?.message || "PayPal payment could not be completed.");
      } finally {
        if (active) {
          setIsPayPalProcessing(false);
        }
      }
    };

    capturePayPalOrder();

    return () => {
      active = false;
    };
  }, [emailScriptUrl, isPayPalProcessing, workshopSlotKey]);

  const handleCheckout = async (purpose, gateway) => {
    setCheckoutStatus("");
    if (!checkoutReady) {
      setCheckoutStatus("Complete the booking form above to unlock checkout.");
      return;
    }

    const isProgram = purpose === "program";
    const selected = isProgram ? programPricing : pricingInfo;
    const gatewaySelected =
      gateway === "paypal" && inferredRegion !== "IN"
        ? {
            ...selected,
            currency: paypalGlobalCurrency,
            amount: getConvertedAmount((selected.baseInr || 0) * (rates[paypalGlobalCurrency] || fallbackRates[paypalGlobalCurrency] || 1)),
          }
        : selected;

    if (!gatewaySelected.amount) {
      setCheckoutStatus("Program price is not set. Add VITE_PROGRAM_AMOUNT_INR and VITE_PROGRAM_GLOBAL_INR in .env.");
      return;
    }

    try {
      setIsGatewayBusy(true);
      if (gateway === "razorpay") {
        if (!orderScriptUrl) {
          throw new Error("Missing order endpoint. Add VITE_RAZORPAY_ORDER_SCRIPT_URL in .env or deploy /api/razorpay-order.");
        }

        const ok = await loadRazorpayScript();
        if (!ok) {
          throw new Error("Razorpay SDK failed to load. Check your connection and try again.");
        }

        const factor = getSubunitFactor(gatewaySelected.currency);
        const amountSubunits = Math.round(gatewaySelected.amount * factor);
        const payload = {
          action: "create_order",
          amount: amountSubunits,
          currency: gatewaySelected.currency,
          purpose,
          receipt: `ka_${purpose}_${Date.now()}`,
          notes: {
            country: country || "",
            payment_region: inferredRegion,
            demo_slot: demoSlot || "",
            workshop_slot_key: workshopSlotKey || "",
          },
        };

        const response = await fetch(orderScriptUrl, {
          method: "POST",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: JSON.stringify(payload),
        });

        const data = await readJsonResponse(response);
        if (!response.ok || !data?.ok) {
          throw new Error(data?.error || "Order creation failed.");
        }

        const prefill = getPrefill();
        const rzp = new window.Razorpay({
          key: data.key,
          amount: data.amount,
          currency: data.currency,
          name: "Kraft Academy",
          description: purpose === "program" ? "Program Enrollment" : "Workshop Booking",
          order_id: data.order_id,
          prefill,
          handler: async function () {
            await completeSuccessfulPayment(purpose);
          },
          notes: payload.notes,
          theme: { color: "#1E293B" },
        });

        rzp.open();
        return;
      }

      const paypalResponse = await fetch("/api/paypal-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: gatewaySelected.amount,
          currency: gatewaySelected.currency,
          purpose,
          siteUrl: typeof window !== "undefined" ? window.location.origin : "",
        }),
      });

      const paypalData = await readJsonResponse(paypalResponse);
      if (!paypalResponse.ok || !paypalData?.ok || !paypalData?.approveUrl) {
        throw new Error(paypalData?.error || "PayPal payment could not be started.");
      }

      window.location.href = paypalData.approveUrl;
    } catch (error) {
      setCheckoutStatus(error?.message || "Payment could not be started.");
    } finally {
      setIsGatewayBusy(false);
    }
  };

  const renderGatewayButtons = (purpose, highlightedPurpose) => (
    <div className="mt-3 flex flex-col gap-3">
      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={() => handleCheckout(purpose, "razorpay")}
          disabled={!canShowCheckout || isGatewayBusy}
          className={`inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50 sm:flex-1 ${highlightedCard === highlightedPurpose ? "animate-pulseSoft" : ""}`}
        >
          <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white/20">
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-current" aria-hidden="true">
              <path d="M5 4h10a4 4 0 0 1 0 8H9v8H5V4Zm4 4h6a2 2 0 1 0 0-4H9v4Z" />
            </svg>
          </span>
          {canShowCheckout ? "Pay via Razorpay" : "Checkout Locked"}
        </button>
        <button
          type="button"
          onClick={() => handleCheckout(purpose, "paypal")}
          disabled={!canShowCheckout || isGatewayBusy}
          className={`inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-900 transition hover:border-slate-400 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 sm:flex-1 ${highlightedCard === highlightedPurpose ? "animate-pulseSoft" : ""}`}
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
            <path d="M7.34 4.65h5.51c2.58 0 4.07 1.62 3.66 3.92-.45 2.52-2.41 3.96-5.23 3.96H9.36l-.69 4.38H5.62L7.34 4.65Zm2.45 5.51h1.53c1.46 0 2.33-.6 2.55-1.82.2-1.13-.44-1.75-1.86-1.75H9.98l-.19 1.23Zm6.38-.7h2.62l-.28 1.59h.04c.64-1.08 1.63-1.84 3.01-1.84.18 0 .45.02.61.06l-.47 2.65a2.84 2.84 0 0 0-.87-.1c-1.92 0-2.8 1.18-3.1 2.89l-.65 3.73h-2.73l1.82-10.98Zm-8.95 0h2.74L8.15 20.35H5.41L7.22 9.46Z" />
          </svg>
          {canShowCheckout ? "Pay via PayPal" : "Checkout Locked"}
        </button>
      </div>
      {inferredRegion === "IN" ? (
        <p className="text-xs text-slate-500">
          PayPal availability for India can depend on PayPal account setup and supported currency behavior.
        </p>
      ) : (
        <p className="text-xs text-slate-500">
          PayPal checkout is processed in USD. PayPal may handle local currency conversion on the user&apos;s side.
        </p>
      )}
    </div>
  );

  return (
    <section id="pricing" className="px-4 pb-12 pt-6 md:px-6" aria-labelledby="pricing-title">
      <div className="mx-auto max-w-6xl">
        <h2 id="pricing-title" className="text-2xl font-bold text-slate-900 md:text-3xl">
          Checkout
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-slate-700 md:text-base">
          Complete any booking flow above to reveal the payment amount available for your location.
        </p>

        <div
          id="razorpay-checkout"
          className={`mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition md:p-6 ${
            isHighlighted ? "ring-2 ring-amber-300 shadow-lg shadow-amber-200/40" : ""
          }`}
        >
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Payment Checkout</h3>
              <p className="mt-1 text-sm text-slate-700">
                {canShowCheckout
                  ? "Choose the payment gateway you want to use. Your workshop or program amount is now locked for the current booking flow."
                  : "Your payment amount and gateway options will appear here after you complete one of the booking flows above."}
              </p>
              <div className="mt-4 inline-flex w-fit rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                {rateSource === "live" ? "Live FX rates" : "Estimated FX rates"}
              </div>
              <div className="mt-3 flex flex-wrap gap-2 text-xs font-medium text-slate-700">
                <span className="rounded-full bg-slate-100 px-3 py-1">1. Booking details saved</span>
                <span className="rounded-full bg-slate-100 px-3 py-1">2. Payment completed</span>
                <span className="rounded-full bg-slate-100 px-3 py-1">3. Confirmation + session link on email</span>
              </div>
              {canShowCheckout && demoSlot && (
                <div className="mt-3 inline-flex max-w-full animate-pulseSoft rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-slate-900">
                  Selected workshop slot: {demoSlot}
                </div>
              )}
            </div>
            <div className="flex flex-col gap-3 md:max-w-[25rem] md:items-end">
              <div className="inline-flex items-center rounded-full bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700">
                {canShowCheckout ? `${inferredRegion === "IN" ? "India" : "Global"} checkout unlocked` : "Checkout unlocks after booking confirmation"}
              </div>
              <p className="text-xs leading-relaxed text-slate-500 md:text-right">
                {canShowCheckout
                  ? `Payment region locked to ${inferredRegion === "IN" ? "India" : "Global"} based on the booking flow you completed.`
                  : checkoutHint}
              </p>
              {canShowCheckout && (
                <p className="text-xs font-semibold text-slate-700 md:text-right">Recommended gateway: {recommendedGateway}</p>
              )}
              {canShowCheckout && inferredRegion === "GLOBAL" && (
                <p className="text-xs text-slate-500 md:text-right">
                  Country detected: {effectiveCountry || "Not selected"} · Currency: {displayCurrency}
                </p>
              )}
            </div>
          </div>

          <div className={`mt-6 grid gap-4 ${checkoutGridClass}`}>
            {showWorkshopCard && (
            <div className={`rounded-2xl border bg-slate-50 p-4 transition ${highlightedCard === "workshop" ? "animate-pulseSoft border-amber-300 ring-2 ring-amber-300 shadow-lg shadow-amber-200/40" : "border-slate-200"}`}>
              <p className="text-sm font-semibold text-slate-800">Workshop Payment</p>
              <p className="mt-1 text-sm text-slate-700">
                {canShowCheckout ? `Pay ${workshopCheckoutLabel}` : "Complete a workshop booking above to unlock this checkout"}
              </p>
              {!canShowCheckout && (
                <div className="mt-3 rounded-2xl border border-dashed border-slate-300 bg-white/80 px-3 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Locked until booking is confirmed</p>
                  <p className="mt-1 text-sm text-slate-600">{lockedWorkshopHint}</p>
                </div>
              )}
              {canShowCheckout && inferredRegion === "GLOBAL" && (
                <p className="mt-1 text-xs text-slate-500">~{formatMoney(pricingInfo.raw, displayCurrency)} for {pricingInfo.baseInr} INR.</p>
              )}
              {canShowCheckout && inferredRegion === "IN" && !demoSlot && (
                <p className="mt-1 text-xs text-slate-500">India 1:1 demo price is locked at Rs 499 for this booking.</p>
              )}
              {canShowCheckout && inferredRegion === "IN" && demoSlot && (
                <p className="mt-1 text-xs text-slate-500">India group workshop price is locked at Rs 99 for this selected slot.</p>
              )}
              {canShowCheckout && (
                <p className="mt-2 text-xs font-medium text-slate-600">
                  After payment, the session link and confirmation details will be sent to the email used in the booking form.
                </p>
              )}
              {renderGatewayButtons("workshop", "workshop")}
              {canShowCheckout && inferredRegion === "GLOBAL" && (
                <div className="mt-3 flex items-start gap-2 rounded-xl bg-amber-50 px-3 py-2 text-xs font-medium text-slate-700">
                  <span className="mt-0.5 text-amber-600" aria-hidden="true">
                    •
                  </span>
                  <span>
                    Approximate local payment for this booking: {formatMoneyWithCode(pricingInfo.amount, displayCurrency)}.
                  </span>
                </div>
              )}
            </div>
            )}

            {showProgramCard && (
            <div className={`rounded-2xl border bg-slate-50 p-4 transition ${highlightedCard === "program" ? "animate-pulseSoft border-amber-300 ring-2 ring-amber-300 shadow-lg shadow-amber-200/40" : "border-slate-200"}`}>
              <p className="text-sm font-semibold text-slate-800">Program Payment</p>
              <p className="mt-1 text-sm text-slate-700">
                {canShowCheckout ? `Pay ${programCheckoutLabel}` : "Complete a program booking above to unlock this checkout"}
              </p>
              {!canShowCheckout && (
                <div className="mt-3 rounded-2xl border border-dashed border-slate-300 bg-white/80 px-3 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Locked until enrollment details are saved</p>
                  <p className="mt-1 text-sm text-slate-600">{lockedProgramHint}</p>
                </div>
              )}
              {canShowCheckout && inferredRegion === "GLOBAL" && programPricing.baseInr && (
                <p className="mt-1 text-xs text-slate-500">~{formatMoney(programPricing.raw, displayCurrency)} for {programPricing.baseInr} INR.</p>
              )}
              {canShowCheckout && (
                <p className="mt-2 text-xs font-medium text-slate-600">
                  Program confirmation and session details will be shared on the same email after successful payment.
                </p>
              )}
              {renderGatewayButtons("program", "program")}
              {canShowCheckout && inferredRegion === "GLOBAL" && (
                <div className="mt-3 flex items-start gap-2 rounded-xl bg-amber-50 px-3 py-2 text-xs font-medium text-slate-700">
                  <span className="mt-0.5 text-amber-600" aria-hidden="true">
                    •
                  </span>
                  <span>
                    Approximate local payment for this booking: {formatMoneyWithCode(programPricing.amount, displayCurrency)}.
                  </span>
                </div>
              )}
            </div>
            )}
          </div>

          {checkoutStatus && (
            <p className="mt-4 text-sm font-medium text-slate-700" role="status" aria-live="polite">
              {checkoutStatus}
            </p>
          )}
          {!orderScriptUrl && (
            <p className="mt-2 text-xs text-rose-600">Add VITE_RAZORPAY_ORDER_SCRIPT_URL in .env to enable Razorpay checkout.</p>
          )}
          {(!programInr || !programGlobalInr) && (
            <p className="mt-2 text-xs text-rose-600">Add VITE_PROGRAM_AMOUNT_INR and VITE_PROGRAM_GLOBAL_INR in .env for program checkout.</p>
          )}
        </div>
      </div>
    </section>
  );
}

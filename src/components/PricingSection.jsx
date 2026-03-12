import { useEffect, useMemo, useState } from "react";

const INDIA_AMOUNT_INR = 99;
const GLOBAL_AMOUNT_INR = 1000;

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

const euroCountries = new Set([
  "AT",
  "BE",
  "CY",
  "DE",
  "EE",
  "ES",
  "FI",
  "FR",
  "GR",
  "HR",
  "IE",
  "IT",
  "LT",
  "LU",
  "LV",
  "MT",
  "NL",
  "PT",
  "SI",
  "SK",
]);

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

function applyPsychologicalRounding(value) {
  if (!Number.isFinite(value)) return value;
  if (value <= 0) return 9;
  const rounded = Math.ceil(value / 10) * 10 - 1;
  return Math.max(9, rounded);
}

function getSubunitFactor(currency) {
  const zeroDecimal = new Set(["JPY", "KRW", "VND"]);
  return zeroDecimal.has(currency) ? 1 : 100;
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
    timing: window.localStorage.getItem("ka_timing") || "",
    program: window.localStorage.getItem("ka_program") || "",
  };
}

export default function PricingSection() {
  const [country, setCountry] = useState("");
  const [paymentRegion, setPaymentRegion] = useState("GLOBAL");
  const [currency, setCurrency] = useState("USD");
  const [rates, setRates] = useState(fallbackRates);
  const [rateSource, setRateSource] = useState("fallback");
  const [checkoutStatus, setCheckoutStatus] = useState("");

  useEffect(() => {
    const stored = typeof window !== "undefined" ? window.localStorage.getItem("ka_country") : "";
    if (stored) {
      setCountry(stored);
      setCurrency(getCurrencyForCountry(stored));
      setPaymentRegion(stored === "IN" ? "IN" : "GLOBAL");
    }

    const onCountryChange = () => {
      const updated = window.localStorage.getItem("ka_country") || "";
      setCountry(updated);
      setCurrency(getCurrencyForCountry(updated));
      setPaymentRegion(updated === "IN" ? "IN" : "GLOBAL");
    };

    window.addEventListener("ka-country-change", onCountryChange);
    return () => window.removeEventListener("ka-country-change", onCountryChange);
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

  const pricingInfo = useMemo(() => {
    if (paymentRegion === "IN") {
      return {
        label: formatMoney(INDIA_AMOUNT_INR, "INR"),
        amount: INDIA_AMOUNT_INR,
        currency: "INR",
      };
    }

    const fx = rates[currency] || fallbackRates[currency] || 1;
    const converted = GLOBAL_AMOUNT_INR * fx;
    const rounded = applyPsychologicalRounding(converted);

    return {
      label: formatMoney(rounded, currency),
      amount: rounded,
      currency,
      raw: converted,
    };
  }, [paymentRegion, currency, rates]);

  const programInr = Number(import.meta.env.VITE_PROGRAM_AMOUNT_INR || 0);
  const programGlobalInr = Number(import.meta.env.VITE_PROGRAM_GLOBAL_INR || 0);

  const programPricing = useMemo(() => {
    const baseInr = paymentRegion === "IN" ? programInr : programGlobalInr;
    if (!baseInr) {
      return { label: "Set program price", amount: 0, currency: paymentRegion === "IN" ? "INR" : currency };
    }
    if (paymentRegion === "IN") {
      return {
        label: formatMoney(baseInr, "INR"),
        amount: baseInr,
        currency: "INR",
      };
    }
    const fx = rates[currency] || fallbackRates[currency] || 1;
    const converted = baseInr * fx;
    const rounded = applyPsychologicalRounding(converted);
    return {
      label: formatMoney(rounded, currency),
      amount: rounded,
      currency,
      raw: converted,
    };
  }, [programInr, programGlobalInr, paymentRegion, currency, rates]);

  const orderScriptUrl = import.meta.env.VITE_RAZORPAY_ORDER_SCRIPT_URL || "";

  const handleCheckout = async (purpose) => {
    setCheckoutStatus("");
    if (!orderScriptUrl) {
      setCheckoutStatus("Missing order script URL. Add VITE_RAZORPAY_ORDER_SCRIPT_URL in .env.");
      return;
    }

    const isProgram = purpose === "program";
    const selected = isProgram ? programPricing : pricingInfo;

    if (!selected.amount) {
      setCheckoutStatus("Program price is not set. Add VITE_PROGRAM_AMOUNT_INR and VITE_PROGRAM_GLOBAL_INR in .env.");
      return;
    }

    const ok = await loadRazorpayScript();
    if (!ok) {
      setCheckoutStatus("Razorpay SDK failed to load. Check your connection and try again.");
      return;
    }

    const factor = getSubunitFactor(selected.currency);
    const amountSubunits = Math.round(selected.amount * factor);

    try {
      const payload = {
        action: "create_order",
        amount: amountSubunits,
        currency: selected.currency,
        purpose,
        receipt: `ka_${purpose}_${Date.now()}`,
        notes: {
          country: country || "",
          payment_region: paymentRegion,
        },
      };

      const response = await fetch(orderScriptUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || "Order request failed");
      }

      const data = await response.json();
      if (!data?.ok) {
        throw new Error(data?.error || "Order creation failed");
      }

      const prefill = getPrefill();

      const rzp = new window.Razorpay({
        key: data.key,
        amount: data.amount,
        currency: data.currency,
        name: "Kraft Academy",
        description: purpose === "program" ? "Program Enrollment" : "AI Study Skills Workshop",
        order_id: data.order_id,
        prefill,
        handler: async function () {
          if (typeof window !== "undefined") {
            window.localStorage.setItem("ka_last_payment", purpose);
            window.location.hash = "#thank-you";
          }
          try {
            const lead = getLeadDetails();
            await fetch(orderScriptUrl, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                action: "send_confirmation",
                purpose,
                name: lead.name,
                email: lead.email,
                contact: lead.contact,
                age: lead.age,
                country: lead.country,
                timing: lead.timing,
                program: lead.program,
              }),
            });
          } catch (_) {
            // ignore email failures for now
          }
          setCheckoutStatus("Payment successful. We will contact you shortly.");
        },
        notes: payload.notes,
        theme: { color: "#1E293B" },
      });

      rzp.open();
    } catch (err) {
      setCheckoutStatus(err?.message || "Payment could not be started.");
    }
  };

  return (
    <section id="pricing" className="px-4 pb-12 pt-6 md:px-6" aria-labelledby="pricing-title">
      <div className="mx-auto max-w-6xl">
        <h2 id="pricing-title" className="text-2xl font-bold text-slate-900 md:text-3xl">
          Pricing
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-slate-700 md:text-base">
          Simple pricing for workshop access and full programs.
        </p>

        <div className="mt-6 grid gap-5 md:grid-cols-3">
          <div className="rounded-2xl border border-amber-200 bg-white p-5 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900">AI Study Skills Workshop</h3>
            <p className="mt-2 text-sm text-slate-700">Includes AI Study Toolkit and live session.</p>
            <div className="mt-4 inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-slate-900">
              Limited seats
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900">AI Future Skills</h3>
            <p className="mt-2 text-sm text-slate-700">4-week program with real-world AI projects.</p>
            <ul className="mt-3 space-y-2 text-sm text-slate-700">
              <li>AI foundations</li>
              <li>Productivity tools</li>
              <li>Live projects</li>
            </ul>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900">Coding Bootcamp</h3>
            <p className="mt-2 text-sm text-slate-700">2-month coding program for Ages 11–18.</p>
            <ul className="mt-3 space-y-2 text-sm text-slate-700">
              <li>Logic building</li>
              <li>Mini projects</li>
              <li>Competitive mindset</li>
            </ul>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Razorpay Checkout</h3>
              <p className="mt-1 text-sm text-slate-700">Pay securely via UPI, Debit Card, or Credit Card.</p>
              <div className="mt-4 inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                {rateSource === "live" ? "Live FX rates" : "Estimated FX rates"}
              </div>
            </div>
            <div className="flex flex-col gap-3 md:items-end">
              <div className="flex items-center gap-2 rounded-full bg-slate-100 p-1">
                <button
                  type="button"
                  onClick={() => setPaymentRegion("IN")}
                  className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
                    paymentRegion === "IN" ? "bg-slate-900 text-white" : "text-slate-700"
                  }`}
                >
                  India
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentRegion("GLOBAL")}
                  className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
                    paymentRegion === "GLOBAL" ? "bg-slate-900 text-white" : "text-slate-700"
                  }`}
                >
                  Global
                </button>
              </div>
              {paymentRegion === "GLOBAL" && (
                <p className="text-xs text-slate-500">
                  Country detected: {country || "Not selected"} • Currency: {currency}
                </p>
              )}
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-800">Workshop Payment</p>
              <p className="mt-1 text-sm text-slate-700">Pay {pricingInfo.label}</p>
              {paymentRegion === "GLOBAL" && (
                <p className="mt-1 text-xs text-slate-500">Converted from {GLOBAL_AMOUNT_INR} INR with psychological rounding.</p>
              )}
              <button
                type="button"
                onClick={() => handleCheckout("workshop")}
                className="mt-3 inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800"
              >
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white/20">
                  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-current" aria-hidden="true">
                    <path d="M5 4h10a4 4 0 0 1 0 8H9v8H5V4Zm4 4h6a2 2 0 1 0 0-4H9v4Z" />
                  </svg>
                </span>
                Pay Workshop via Razorpay
              </button>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-800">Program Payment</p>
              <p className="mt-1 text-sm text-slate-700">Pay {programPricing.label}</p>
              <button
                type="button"
                onClick={() => handleCheckout("program")}
                className="mt-3 inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800"
              >
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white/20">
                  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-current" aria-hidden="true">
                    <path d="M5 4h10a4 4 0 0 1 0 8H9v8H5V4Zm4 4h6a2 2 0 1 0 0-4H9v4Z" />
                  </svg>
                </span>
                Pay Program via Razorpay
              </button>
            </div>
          </div>

          {checkoutStatus && (
            <p className="mt-4 text-sm font-medium text-slate-700" role="status" aria-live="polite">
              {checkoutStatus}
            </p>
          )}
          {!orderScriptUrl && (
            <p className="mt-2 text-xs text-rose-600">
              Add VITE_RAZORPAY_ORDER_SCRIPT_URL in .env to enable checkout.
            </p>
          )}
          {(!programInr || !programGlobalInr) && (
            <p className="mt-2 text-xs text-rose-600">Add VITE_PROGRAM_AMOUNT_INR and VITE_PROGRAM_GLOBAL_INR in .env for program checkout.</p>
          )}
        </div>
      </div>
    </section>
  );
}

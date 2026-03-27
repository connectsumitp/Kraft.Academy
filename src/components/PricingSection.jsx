import { useEffect, useMemo, useState } from "react";
import { isValidPhoneNumber } from "react-phone-number-input";

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

const dialCodeMap = [
  { code: "+1", countries: ["US", "CA"] },
  { code: "+44", countries: ["GB"] },
  { code: "+971", countries: ["AE"] },
  { code: "+65", countries: ["SG"] },
  { code: "+61", countries: ["AU"] },
  { code: "+64", countries: ["NZ"] },
  { code: "+91", countries: ["IN"] },
];

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

function getConvertedAmount(value) {
  if (!Number.isFinite(value)) return value;
  if (value <= 0) return 0;
  return Math.max(1, Math.round(value));
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
    date: window.localStorage.getItem("ka_date") || "",
    timing: window.localStorage.getItem("ka_timing") || "",
    program: window.localStorage.getItem("ka_program") || "",
  };
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

function getCountryFromPhone(value) {
  if (!value || typeof value !== "string") return "";
  const match = dialCodeMap.find((entry) => value.startsWith(entry.code));
  return match ? match.countries[0] : "";
}

function getRegionFromContact(contact) {
  if (!contact || typeof contact !== "string") return "";
  if (contact.startsWith("+91")) return "IN";
  if (contact.startsWith("+")) return "GLOBAL";
  return "";
}

export default function PricingSection() {
  const [country, setCountry] = useState("");
  const [contact, setContact] = useState("");
  const [demoSlot, setDemoSlot] = useState("");
  const [paymentRegion, setPaymentRegion] = useState("GLOBAL");
  const [currency, setCurrency] = useState("USD");
  const [rates, setRates] = useState(fallbackRates);
  const [rateSource, setRateSource] = useState("fallback");
  const [checkoutStatus, setCheckoutStatus] = useState("");
  const [isHighlighted, setIsHighlighted] = useState(false);
  const [highlightedCard, setHighlightedCard] = useState("");
  const [isPayPalProcessing, setIsPayPalProcessing] = useState(false);

  useEffect(() => {
    const stored = typeof window !== "undefined" ? window.localStorage.getItem("ka_country") : "";
    const storedContact = typeof window !== "undefined" ? window.localStorage.getItem("ka_contact") : "";
    const storedDemoSlot = typeof window !== "undefined" ? window.localStorage.getItem("ka_demo_slot") : "";
    if (stored) {
      setCountry(stored);
      setCurrency(getCurrencyForCountry(stored));
      setPaymentRegion(stored === "IN" ? "IN" : "GLOBAL");
    }
    if (storedContact) {
      setContact(storedContact);
    }
    if (storedDemoSlot) {
      setDemoSlot(storedDemoSlot);
    }

    const onCountryChange = () => {
      const updated = window.localStorage.getItem("ka_country") || "";
      setCountry(updated);
      setCurrency(getCurrencyForCountry(updated));
      if (updated) {
        setPaymentRegion(updated === "IN" ? "IN" : "GLOBAL");
      }
    };

    const onContactChange = () => {
      const updatedContact = window.localStorage.getItem("ka_contact") || "";
      setContact(updatedContact);
      const inferred = getCountryFromPhone(updatedContact);
      if (inferred) {
        setCountry(inferred);
        setCurrency(getCurrencyForCountry(inferred));
        setPaymentRegion(inferred === "IN" ? "IN" : "GLOBAL");
      }
    };

    const onDemoSlotChange = () => {
      const updatedDemoSlot = window.localStorage.getItem("ka_demo_slot") || "";
      setDemoSlot(updatedDemoSlot);
    };

    window.addEventListener("ka-country-change", onCountryChange);
    window.addEventListener("ka-contact-change", onContactChange);
    window.addEventListener("ka-demo-slot-change", onDemoSlotChange);
    return () => {
      window.removeEventListener("ka-country-change", onCountryChange);
      window.removeEventListener("ka-contact-change", onContactChange);
      window.removeEventListener("ka-demo-slot-change", onDemoSlotChange);
    };
  }, []);

  useEffect(() => {
    const onHighlight = () => {
      setIsHighlighted(true);
      setTimeout(() => setIsHighlighted(false), 2000);
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

  const isContactValid = useMemo(() => (contact ? isValidPhoneNumber(contact) : false), [contact]);
  const contactCountry = useMemo(() => (isContactValid ? getCountryFromPhone(contact) : ""), [contact, isContactValid]);
  const contactRegion = useMemo(() => getRegionFromContact(contact), [contact]);
  const inferredRegion = (isContactValid ? contactRegion : "") || (country ? (country === "IN" ? "IN" : "GLOBAL") : paymentRegion);
  const effectiveCountry = contactCountry || country;
  const displayCurrency = useMemo(() => {
    if (inferredRegion === "IN") return "INR";
    if (contactCountry && contactCountry !== "IN") return getCurrencyForCountry(contactCountry);
    if (country && country !== "IN") return getCurrencyForCountry(country);
    return "USD";
  }, [country, inferredRegion, contactCountry]);
  const hasPaymentAccess = Boolean(contactRegion && isContactValid);

  useEffect(() => {
    if (contactRegion) {
      setPaymentRegion(contactRegion);
    }
  }, [contactRegion]);

  const pricingInfo = useMemo(() => {
    if (inferredRegion === "IN") {
      return {
        label: formatMoney(INDIA_AMOUNT_INR, "INR"),
        amount: INDIA_AMOUNT_INR,
        currency: "INR",
      };
    }

    const fx = rates[displayCurrency] || fallbackRates[displayCurrency] || 1;
    const converted = GLOBAL_AMOUNT_INR * fx;
    const rounded = getConvertedAmount(converted);

    return {
      label: formatMoney(rounded, displayCurrency),
      amount: rounded,
      currency: displayCurrency,
      raw: converted,
      baseInr: GLOBAL_AMOUNT_INR,
    };
  }, [inferredRegion, displayCurrency, rates]);

  const programInr = Number(import.meta.env.VITE_PROGRAM_AMOUNT_INR || 0);
  const programGlobalInr = Number(import.meta.env.VITE_PROGRAM_GLOBAL_INR || 0);

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

  const orderScriptUrl = import.meta.env.VITE_RAZORPAY_ORDER_SCRIPT_URL || "/api/razorpay-order";
  const emailScriptUrl = import.meta.env.VITE_RAZORPAY_EMAIL_SCRIPT_URL || orderScriptUrl;

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

        const data = await response.json();
        if (!response.ok || !data?.ok) {
          throw new Error(data?.error || "PayPal payment could not be verified.");
        }

        if (!active) return;

        window.sessionStorage.setItem("ka_last_payment", purpose);
        window.location.hash = "#thank-you";

        try {
          await sendConfirmationEmail(emailScriptUrl, purpose);
        } catch (_) {
          // ignore email failures for now
        }

        url.searchParams.delete("paypal_return");
        url.searchParams.delete("paypal_purpose");
        url.searchParams.delete("token");
        url.searchParams.delete("PayerID");
        window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash || "#thank-you"}`);

        setCheckoutStatus("Payment successful. We will contact you shortly.");
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
  }, [emailScriptUrl, isPayPalProcessing]);

  const handleCheckout = async (purpose) => {
    setCheckoutStatus("");
    if (!hasPaymentAccess) {
      setCheckoutStatus(demoSlot
        ? "Selected demo slot is India-only. Add a valid Indian contact number in the booking form to unlock the Rs 99 payment."
        : "Enter a valid contact number to unlock the correct payment option for your region.");
      return;
    }
    if (!orderScriptUrl) {
      setCheckoutStatus("Missing order endpoint. Add VITE_RAZORPAY_ORDER_SCRIPT_URL in .env or deploy /api/razorpay-order.");
      return;
    }

    const isProgram = purpose === "program";
    const selected = isProgram ? programPricing : pricingInfo;

    if (!selected.amount) {
      setCheckoutStatus("Program price is not set. Add VITE_PROGRAM_AMOUNT_INR and VITE_PROGRAM_GLOBAL_INR in .env.");
      return;
    }

    try {
      if (inferredRegion === "IN") {
        const ok = await loadRazorpayScript();
        if (!ok) {
          setCheckoutStatus("Razorpay SDK failed to load. Check your connection and try again.");
          return;
        }

        const factor = getSubunitFactor(selected.currency);
        const amountSubunits = Math.round(selected.amount * factor);
        const payload = {
          action: "create_order",
          amount: amountSubunits,
          currency: selected.currency,
          purpose,
          receipt: `ka_${purpose}_${Date.now()}`,
          notes: {
            country: country || "",
            payment_region: inferredRegion,
            demo_slot: demoSlot || "",
          },
        };

        const response = await fetch(orderScriptUrl, {
          method: "POST",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
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
              window.sessionStorage.setItem("ka_last_payment", purpose);
              window.location.hash = "#thank-you";
            }
            try {
              await sendConfirmationEmail(emailScriptUrl, purpose);
            } catch (_) {
              // ignore email failures for now
            }
            setCheckoutStatus("Payment successful. We will contact you shortly.");
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
          amount: selected.amount,
          currency: selected.currency,
          purpose,
          siteUrl: typeof window !== "undefined" ? window.location.origin : "",
        }),
      });

      const paypalData = await paypalResponse.json();
      if (!paypalResponse.ok || !paypalData?.ok || !paypalData?.approveUrl) {
        throw new Error(paypalData?.error || "PayPal payment could not be started.");
      }

      window.location.href = paypalData.approveUrl;
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

        <div
          id="razorpay-checkout"
          className={`mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition md:p-6 ${
            isHighlighted ? "ring-2 ring-amber-300 shadow-lg shadow-amber-200/40" : ""
          }`}
        >
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-900">{inferredRegion === "IN" ? "Razorpay Checkout" : "PayPal Checkout"}</h3>
              <p className="mt-1 text-sm text-slate-700">
                {inferredRegion === "IN" ? "Pay securely via UPI, Debit Card, or Credit Card." : "Pay securely via PayPal or international cards."}
              </p>
              <div className="mt-4 inline-flex w-fit rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                {rateSource === "live" ? "Live FX rates" : "Estimated FX rates"}
              </div>
              {demoSlot && (
                <div className="mt-3 inline-flex max-w-full animate-pulseSoft rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-slate-900">
                  Selected demo slot: {demoSlot}
                </div>
              )}
            </div>
            <div className="flex flex-col gap-3 md:max-w-[22rem] md:items-end">
              <div className="inline-flex items-center rounded-full bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700">
                {hasPaymentAccess ? `Showing ${inferredRegion === "IN" ? "India" : "Global"} pricing only` : "Pricing unlocks after contact verification"}
              </div>
              <p className="text-xs leading-relaxed text-slate-500 md:text-right">
                {contactRegion
                  ? `Payment region locked to ${inferredRegion === "IN" ? "India" : "Global"} based on contact number.`
                  : "Enter a valid Indian number to see India pricing, or a valid international number to see Global pricing."}
              </p>
              {hasPaymentAccess && inferredRegion === "GLOBAL" && (
                <p className="text-xs text-slate-500 md:text-right">
                  Country detected: {effectiveCountry || "Not selected"} • Currency: {displayCurrency}
                </p>
              )}
              {demoSlot && !hasPaymentAccess && (
                <p className="text-xs font-medium leading-relaxed text-amber-700 md:text-right">
                  Demo slots are for India only. Add a valid Indian contact number to unlock the Rs 99 payment.
                </p>
              )}
            </div>
          </div>

          <div className="mt-6 grid gap-4 xl:grid-cols-2">
            <div className={`rounded-2xl border bg-slate-50 p-4 transition ${highlightedCard === "workshop" ? "animate-pulseSoft border-amber-300 ring-2 ring-amber-300 shadow-lg shadow-amber-200/40" : "border-slate-200"}`}>
              <p className="text-sm font-semibold text-slate-800">Workshop Payment</p>
              <p className="mt-1 text-sm text-slate-700">{hasPaymentAccess ? `Pay ${pricingInfo.label}` : "Enter a valid contact number to view your workshop price"}</p>
              {hasPaymentAccess && inferredRegion === "GLOBAL" && (
                <p className="mt-1 text-xs text-slate-500">
                  ~{formatMoney(pricingInfo.raw, displayCurrency)} for {pricingInfo.baseInr} INR.
                </p>
              )}
              <button
                type="button"
                onClick={() => handleCheckout("workshop")}
                disabled={!hasPaymentAccess}
                className={`mt-3 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto ${highlightedCard === "workshop" ? "animate-pulseSoft" : ""}`}
              >
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white/20">
                  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-current" aria-hidden="true">
                    <path d="M5 4h10a4 4 0 0 1 0 8H9v8H5V4Zm4 4h6a2 2 0 1 0 0-4H9v4Z" />
                  </svg>
                </span>
                {inferredRegion === "IN" ? "Pay Workshop via Razorpay" : "Pay Workshop via PayPal"}
              </button>
            </div>

            <div className={`rounded-2xl border bg-slate-50 p-4 transition ${highlightedCard === "program" ? "animate-pulseSoft border-amber-300 ring-2 ring-amber-300 shadow-lg shadow-amber-200/40" : "border-slate-200"}`}>
              <p className="text-sm font-semibold text-slate-800">Program Payment</p>
              <p className="mt-1 text-sm text-slate-700">{hasPaymentAccess ? `Pay ${programPricing.label}` : "Enter a valid contact number to view your program price"}</p>
              {hasPaymentAccess && inferredRegion === "GLOBAL" && programPricing.baseInr && (
                <p className="mt-1 text-xs text-slate-500">
                  ~{formatMoney(programPricing.raw, displayCurrency)} for {programPricing.baseInr} INR.
                </p>
              )}
              <button
                type="button"
                onClick={() => handleCheckout("program")}
                disabled={!hasPaymentAccess}
                className={`mt-3 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto ${highlightedCard === "program" ? "animate-pulseSoft" : ""}`}
              >
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white/20">
                  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-current" aria-hidden="true">
                    <path d="M5 4h10a4 4 0 0 1 0 8H9v8H5V4Zm4 4h6a2 2 0 1 0 0-4H9v4Z" />
                  </svg>
                </span>
                {inferredRegion === "IN" ? "Pay Program via Razorpay" : "Pay Program via PayPal"}
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


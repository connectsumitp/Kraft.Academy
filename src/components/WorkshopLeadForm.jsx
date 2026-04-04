import { useEffect, useMemo, useState } from "react";
import PhoneInput, { isValidPhoneNumber } from "react-phone-number-input";
import { getPreferredDateBounds, getPreferredTimingOptions, getTimingTimezoneLabel, isAvailabilityDateBlocked } from "./countryTiming";
import { fetchAvailability } from "../lib/availability";
import { getCountryFromPhone } from "../lib/phoneCountry";

const localeCountryMap = {
  "en-US": "US",
  "en-CA": "CA",
  "en-GB": "GB",
  "en-AE": "AE",
  "en-SG": "SG",
  "en-IN": "IN",
  "en-AU": "AU",
  "en-IE": "IE",
  "en-NZ": "NZ",
};

function getDefaultCountry() {
  if (typeof navigator === "undefined") return "US";
  const locale = navigator.language || "en-US";
  return localeCountryMap[locale] || locale.split("-")[1] || "US";
}

function addDaysToIsoDate(isoDate, days) {
  const [year, month, day] = String(isoDate).split("-").map(Number);
  const utcDate = new Date(Date.UTC(year, month - 1, day + days, 12, 0, 0));
  return utcDate.toISOString().slice(0, 10);
}

function formatDisplayDate(isoDate) {
  const [year, month, day] = String(isoDate).split("-").map(Number);
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(Date.UTC(year, month - 1, day, 12, 0, 0)));
}

export default function WorkshopLeadForm() {
  const [form, setForm] = useState({
    name: "",
    contact: "",
    email: "",
    age: "",
    country: "",
    date: "",
    timing: "",
  });
  const [touched, setTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");
  const [geoCountry, setGeoCountry] = useState("");
  const [availabilityItems, setAvailabilityItems] = useState([]);

  const isContactValid = useMemo(() => (form.contact ? isValidPhoneNumber(form.contact) : false), [form.contact]);
  const timingOptions = useMemo(
    () => getPreferredTimingOptions(form.country, form.date, availabilityItems),
    [form.country, form.date, availabilityItems]
  );
  const timingLabel = useMemo(() => getTimingTimezoneLabel(form.country, form.date, "preferred"), [form.country, form.date]);
  const defaultCountry = useMemo(getDefaultCountry, []);
  const resolvedDefaultCountry = geoCountry || defaultCountry;
  const preferredBounds = useMemo(() => getPreferredDateBounds(), []);
  const availableDateOptions = useMemo(() => {
    const options = [];
    for (let offset = 0; offset < 7; offset += 1) {
      const isoDate = addDaysToIsoDate(preferredBounds.min, offset);
      if (isoDate > preferredBounds.max) continue;
      if (isAvailabilityDateBlocked("preferred", isoDate, availabilityItems)) continue;
      if (form.country && getPreferredTimingOptions(form.country, isoDate, availabilityItems).length === 0) continue;
      options.push({
        value: isoDate,
        label: formatDisplayDate(isoDate),
      });
    }
    return options;
  }, [availabilityItems, form.country, preferredBounds]);

  useEffect(() => {
    let active = true;
    fetchAvailability().then((items) => {
      if (active) {
        setAvailabilityItems(items);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    const geoUrl = import.meta.env.VITE_GEOIP_URL || "https://ipapi.co/json/";
    fetch(geoUrl)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!active || !data) return;
        const code = (data.country_code || data.country || data.countryCode || "").toUpperCase();
        if (code) {
          setGeoCountry(code);
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!form.country && typeof window !== "undefined") {
      const storedCountry = window.localStorage.getItem("ka_country");
      if (storedCountry) {
        setForm((prev) => ({ ...prev, country: storedCountry }));
      } else if (geoCountry) {
        setForm((prev) => ({ ...prev, country: geoCountry }));
      } else if (defaultCountry) {
        setForm((prev) => ({ ...prev, country: defaultCountry }));
      }
    }
  }, [defaultCountry, form.country, geoCountry]);

  useEffect(() => {
    if (!form.date) return;
    if (!isAvailabilityDateBlocked("preferred", form.date, availabilityItems)) return;

    setForm((prev) => ({ ...prev, date: "", timing: "" }));
    setSubmitMessage("This option is unavailable. Please choose another one.");
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("ka_date");
      window.localStorage.removeItem("ka_timing");
      window.dispatchEvent(new Event("ka-date-change"));
    }
  }, [availabilityItems, form.date]);

  const onChange = (event) => {
    const { name, value } = event.target;
    if (name === "date" && isAvailabilityDateBlocked("preferred", value, availabilityItems)) {
      setSubmitMessage("This option is unavailable. Please choose another one.");
      if (typeof window !== "undefined") {
        window.localStorage.removeItem("ka_date");
        window.localStorage.removeItem("ka_timing");
        window.dispatchEvent(new Event("ka-date-change"));
      }
      setForm((prev) => ({ ...prev, date: "", timing: "" }));
      return;
    }

    if (typeof window !== "undefined" && ["name", "email", "age"].includes(name)) {
      window.localStorage.setItem(`ka_${name}`, value);
      window.dispatchEvent(new Event("ka-booking-input-change"));
    }
    if (name === "date" && typeof window !== "undefined") {
      window.localStorage.setItem("ka_date", value);
      window.localStorage.removeItem("ka_timing");
      window.dispatchEvent(new Event("ka-date-change"));
    }
    if (name === "timing" && typeof window !== "undefined") {
      window.localStorage.setItem("ka_timing", value);
      window.dispatchEvent(new Event("ka-booking-input-change"));
    }

    setForm((prev) => ({
      ...prev,
      [name]: value,
      timing: name === "date" ? "" : name === "timing" ? value : prev.timing,
    }));
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    setTouched(true);
    setSubmitMessage("");

    if (!form.name || !form.age || !form.country || !form.date || !form.timing || !form.email || !isContactValid) {
      return;
    }

    const scriptUrl = import.meta.env.VITE_GOOGLE_SCRIPT_URL;
    if (!scriptUrl) {
      setSubmitMessage("Missing Google Sheet URL. Add VITE_GOOGLE_SCRIPT_URL in env.");
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        name: form.name,
        contact: form.contact,
        email: form.email,
        age: form.age,
        country: form.country,
        date: form.date,
        timing: form.timing,
        program: "",
        lead_type: "workshop_preferred",
        source: "website_workshop_preferred_form",
        created_at: new Date().toISOString(),
        payment_status: "",
      };

      if (typeof window !== "undefined") {
        window.localStorage.setItem("ka_name", form.name);
        window.localStorage.setItem("ka_contact", form.contact);
        window.localStorage.setItem("ka_email", form.email);
        window.localStorage.setItem("ka_age", form.age);
        window.localStorage.setItem("ka_country", form.country);
        window.localStorage.setItem("ka_date", form.date);
        window.localStorage.setItem("ka_timing", form.timing);
        window.localStorage.removeItem("ka_demo_slot");
        window.localStorage.removeItem("ka_workshop_slot_key");
        window.localStorage.setItem("ka_checkout_flow", "workshop");
        window.sessionStorage.setItem("ka_checkout_session_ready", "1");
        window.dispatchEvent(
          new CustomEvent("ka-checkout-snapshot", {
            detail: {
              flow: "workshop",
              country: form.country,
              contact: form.contact,
              demoSlot: "",
              workshopSlotKey: "",
            },
          })
        );
        window.dispatchEvent(new Event("ka-demo-slot-change"));
        window.dispatchEvent(new Event("ka-workshop-slot-key-change"));
        window.dispatchEvent(new Event("ka-checkout-ready"));
        const target = document.getElementById("razorpay-checkout");
        if (target) {
          target.scrollIntoView({ behavior: "smooth", block: "start" });
          window.dispatchEvent(new Event("ka-razorpay-focus"));
          window.dispatchEvent(new CustomEvent("ka-razorpay-card-focus", { detail: { purpose: "workshop" } }));
        } else {
          window.location.hash = "#razorpay-checkout";
        }
        setSubmitMessage(
          "Your preferred 1:1 / global booking details are saved. Continue below to complete payment. We will share the session link on email after successful payment."
        );
      }

      fetch(scriptUrl, {
        method: "POST",
        mode: "no-cors",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
        },
        body: new URLSearchParams(payload).toString(),
      }).catch(() => {
        setSubmitMessage("Your details are saved. We could not confirm lead submission yet, but you can continue with the payment below.");
      });

      setForm((prev) => ({
        name: "",
        contact: "",
        email: "",
        age: "",
        country: prev.country,
        date: "",
        timing: "",
      }));
      setTouched(false);
      setShowSuccess(true);
    } catch {
      setSubmitMessage("Submission failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <section id="workshop-form" className="px-4 pb-10 pt-8 md:px-6" aria-labelledby="workshop-title">
        <div className="mx-auto max-w-6xl rounded-2xl border border-amber-200 bg-white p-6 shadow-sm md:p-8">
          <h2 id="workshop-title" className="text-2xl font-bold text-slate-900 md:text-3xl">
            1:1 / Global Demo Booking
          </h2>
          <p className="mt-2 text-sm text-slate-700">
            Choose a preferred 1:1 demo slot for India or any international demo booking for the next 7 days.
          </p>
          <p className="mt-2 text-xs font-medium text-slate-600">
            Pricing appears at checkout after you enter your details and booking route.
          </p>
          <p className="mt-3 text-xs font-semibold text-emerald-700">
            Preferred bookings are available for the next 7 days only, from 10 AM IST to 12 midnight IST. Friday, Saturday, and Sunday exclude 7-8 PM IST and 8-9 PM IST.
          </p>
          <p className="mt-2 text-xs font-medium text-slate-600">All fields are mandatory.</p>

          <form className="mt-6 grid gap-4 lg:grid-cols-2 xl:grid-cols-3" onSubmit={onSubmit} noValidate>
            <div>
              <label htmlFor="workshop-name" className="mb-1 block text-sm font-medium text-slate-800">
                Name
              </label>
              <input
                id="workshop-name"
                name="name"
                type="text"
                value={form.name}
                onChange={onChange}
                aria-label="Student name"
                required
                className="h-10 w-full rounded-xl border border-slate-300 px-3 py-1.5 text-sm text-slate-900 outline-none ring-offset-2 transition focus:border-amber-500 focus:ring-2 focus:ring-amber-500 md:h-9 md:py-1"
              />
            </div>

            <div className="lg:col-span-2 xl:col-span-1">
              <label htmlFor="workshop-contact" className="mb-1 block text-sm font-medium text-slate-800">
                Contact
              </label>
              <PhoneInput
                id="workshop-contact"
                international
                defaultCountry={resolvedDefaultCountry}
                countryCallingCodeEditable={false}
                countrySelectProps={{ "aria-label": "Country" }}
                placeholder="Enter contact number"
                value={form.contact}
                onChange={(value) => {
                  const next = value || "";
                  const inferred = getCountryFromPhone(next);
                  setForm((prev) => ({
                    ...prev,
                    contact: next,
                    country: inferred || (next ? prev.country : ""),
                    timing: !next || (inferred && inferred !== prev.country) ? "" : prev.timing,
                    date: !next ? "" : prev.date,
                  }));
                  if (typeof window !== "undefined") {
                    window.localStorage.setItem("ka_contact", next);
                    window.dispatchEvent(new Event("ka-contact-change"));
                    window.dispatchEvent(new Event("ka-booking-input-change"));
                    if (inferred && inferred !== form.country) {
                      window.localStorage.setItem("ka_country", inferred);
                      window.localStorage.removeItem("ka_timing");
                      window.dispatchEvent(new Event("ka-country-change"));
                    } else if (!next) {
                      window.localStorage.removeItem("ka_country");
                      window.localStorage.removeItem("ka_timing");
                      window.localStorage.removeItem("ka_date");
                      window.dispatchEvent(new Event("ka-country-change"));
                    }
                  }
                }}
                onCountryChange={(country) => {
                  const nextCountry = country || "";
                  if (nextCountry && nextCountry !== form.country) {
                    setForm((prev) => ({ ...prev, country: nextCountry, timing: "" }));
                    if (typeof window !== "undefined") {
                      window.localStorage.setItem("ka_country", nextCountry);
                      window.dispatchEvent(new Event("ka-country-change"));
                      window.dispatchEvent(new Event("ka-booking-input-change"));
                    }
                  }
                }}
                className="phone-input"
                aria-label="Contact number"
              />
              {touched && !isContactValid && (
                <p className="mt-1 text-sm font-medium text-rose-700">Enter a valid contact number.</p>
              )}
            </div>

            <div>
              <label htmlFor="workshop-email" className="mb-1 block text-sm font-medium text-slate-800">
                Email
              </label>
              <input
                id="workshop-email"
                name="email"
                type="email"
                value={form.email}
                onChange={onChange}
                aria-label="Email"
                required
                className="h-10 w-full rounded-xl border border-slate-300 px-3 py-1.5 text-sm text-slate-900 outline-none ring-offset-2 transition focus:border-amber-500 focus:ring-2 focus:ring-amber-500 md:h-9 md:py-1"
              />
            </div>

            <div>
              <label htmlFor="workshop-age" className="mb-1 block text-sm font-medium text-slate-800">
                Age
              </label>
              <select
                id="workshop-age"
                name="age"
                value={form.age}
                onChange={onChange}
                aria-label="Age"
                required
                className="h-10 w-full rounded-xl border border-slate-300 px-3 py-1.5 text-sm text-slate-900 outline-none ring-offset-2 transition focus:border-amber-500 focus:ring-2 focus:ring-amber-500 md:h-9 md:py-1"
              >
                <option value="">Select Age</option>
                {[11, 12, 13, 14, 15, 16, 17, 18].map((age) => (
                  <option key={age} value={`${age}`}>
                    {age} years
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <p className="select-none text-sm font-medium text-slate-800">Preferred Date</p>
              <select
                id="workshop-date"
                name="date"
                value={form.date}
                onChange={onChange}
                aria-label="Preferred date"
                required
                className="block h-10 w-full cursor-pointer rounded-xl border border-slate-300 px-3 py-1.5 text-sm text-slate-900 outline-none ring-offset-2 transition focus:border-amber-500 focus:ring-2 focus:ring-amber-500 md:h-9 md:px-3 md:py-1"
              >
                <option value="">Select Date</option>
                {availableDateOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {availableDateOptions.length === 0 && (
                <p className="mt-1 text-xs font-medium text-rose-700">
                  No preferred dates are available right now.
                </p>
              )}
            </div>

            <div>
              <label htmlFor="workshop-timing" className="mb-1 block text-sm font-medium text-slate-800">
                Timing
              </label>
              <select
                id="workshop-timing"
                name="timing"
                value={form.timing}
                onChange={onChange}
                aria-label="Timing"
                required
                disabled={!isContactValid || !form.country || !form.date}
                className="h-10 w-full rounded-xl border border-slate-300 px-3 py-1.5 text-sm text-slate-900 outline-none ring-offset-2 transition focus:border-amber-500 focus:ring-2 focus:ring-amber-500 disabled:cursor-not-allowed disabled:bg-slate-100 md:h-9 md:py-1"
              >
                <option value="">{isContactValid && form.country && form.date ? "Select Timing" : "Select Valid Contact and Date First"}</option>
                {timingOptions.map((timing) => (
                  <option key={timing} value={timing}>
                    {timing}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-slate-500">{timingLabel}</p>
              {form.date && isContactValid && timingOptions.length === 0 && (
                <p className="mt-1 text-xs font-medium text-rose-700">
                  This option is unavailable. Please choose another one.
                </p>
              )}
            </div>

            <div className="lg:col-span-2 xl:col-span-3">
              <button
                type="submit"
                disabled={submitting}
                className="rounded-2xl bg-amber-400 px-6 py-3 text-sm font-bold text-slate-900 transition hover:bg-amber-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {submitting ? "Saving Details..." : "Continue to Checkout"}
              </button>
              {submitMessage && (
                <p className="mt-2 text-sm font-medium text-slate-700" role="status" aria-live="polite">
                  {submitMessage}
                </p>
              )}
            </div>
          </form>
        </div>
      </section>

      {showSuccess && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-900/55 px-4" role="dialog" aria-modal="true">
          <div className="max-h-[calc(100vh-2rem)] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-xl font-bold text-slate-900">Booking Saved</h3>
            <p className="mt-3 text-sm leading-relaxed text-slate-700">
              Your preferred booking details are saved. Please complete the payment to confirm your slot. We&apos;ll share the session link by email once the payment is completed.
            </p>
            <p className="mt-2 text-sm text-slate-700">For enquiry, hit the WhatsApp button or mail us.</p>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => setShowSuccess(false)}
                className="rounded-xl bg-amber-400 px-4 py-2 text-sm font-bold text-slate-900 hover:bg-amber-300"
              >
                Done
              </button>
              <a
                href="https://wa.me/919958950167"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-xl border border-slate-300 px-4 py-2 text-center text-sm font-semibold text-slate-800"
              >
                Chat on WhatsApp
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

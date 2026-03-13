import { useEffect, useMemo, useState } from "react";
import PhoneInput, { isValidPhoneNumber } from "react-phone-number-input";
import { getTimingOptions, getTimingTimezoneLabel } from "./countryTiming";

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

const dialCodeMap = [
  { code: "+1", countries: ["US", "CA"] },
  { code: "+44", countries: ["GB"] },
  { code: "+971", countries: ["AE"] },
  { code: "+65", countries: ["SG"] },
  { code: "+61", countries: ["AU"] },
  { code: "+64", countries: ["NZ"] },
  { code: "+91", countries: ["IN"] },
];

function getCountryFromPhone(value) {
  if (!value || typeof value !== "string") return "";
  const match = dialCodeMap.find((entry) => value.startsWith(entry.code));
  return match ? match.countries[0] : "";
}

function getDefaultCountry() {
  if (typeof navigator === "undefined") return "US";
  const locale = navigator.language || "en-US";
  return localeCountryMap[locale] || locale.split("-")[1] || "US";
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

  const isContactValid = useMemo(() => (form.contact ? isValidPhoneNumber(form.contact) : false), [form.contact]);
  const timingOptions = useMemo(() => getTimingOptions(form.country, form.date), [form.country, form.date]);
  const timingLabel = useMemo(() => getTimingTimezoneLabel(form.country, form.date), [form.country, form.date]);
  const defaultCountry = useMemo(getDefaultCountry, []);
  const resolvedDefaultCountry = geoCountry || defaultCountry;

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

  const onChange = (e) => {
    const { name, value } = e.target;
    if (name === "timing" && typeof window !== "undefined") {
      window.localStorage.setItem("ka_timing", value);
    }
    if (name === "date" && typeof window !== "undefined") {
      window.localStorage.setItem("ka_date", value);
      window.dispatchEvent(new Event("ka-date-change"));
    }
    if (typeof window !== "undefined" && ["name", "email", "age"].includes(name)) {
      window.localStorage.setItem(`ka_${name}`, value);
    }
    setForm((prev) => ({
      ...prev,
      [name]: value,
      timing: name === "date" ? "" : name === "timing" ? value : prev.timing,
    }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
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
        lead_type: "workshop",
        source: "website_workshop_top_form",
        created_at: new Date().toISOString(),
        payment_status: "",
      };

      await fetch(scriptUrl, {
        method: "POST",
        mode: "no-cors",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
        },
        body: new URLSearchParams(payload).toString(),
      });

      if (typeof window !== "undefined" && typeof window.fbq === "function") {
        window.fbq("track", "Lead", { lead_type: "workshop", source: "website_workshop_top_form" });
      }
      if (typeof window !== "undefined") {
        const target = document.getElementById("razorpay-checkout");
        if (target) {
          target.scrollIntoView({ behavior: "smooth", block: "start" });
          window.dispatchEvent(new Event("ka-razorpay-focus"));
        } else {
          window.location.hash = "#razorpay-checkout";
        }
        setSubmitMessage("Done. Please complete the payment to confirm your seat. We'll share the session link via email once the payment is completed.\n\nFor enquiry, hit the WhatsApp button or mail us.");
      }

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
    } catch (error) {
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
            Reserve seats for your child
          </h2>
          <p className="mt-2 text-sm text-slate-700">AI Study Skills Workshop for Students (Ages 11 to 18).</p>
          <p className="mt-2 inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-slate-900">
            Includes AI Study Toolkit
          </p>
          <p className="mt-3 text-xs font-semibold text-emerald-700">AI workshop is available every day.</p>
          <p className="mt-2 text-xs font-medium text-slate-600">All fields are mandatory.</p>

          <form className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3" onSubmit={onSubmit} noValidate>
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

            <div className="md:col-span-2 xl:col-span-1">
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
                  setForm((prev) => ({ ...prev, contact: next }));
                  if (typeof window !== "undefined") {
                    window.localStorage.setItem("ka_contact", next);
                    window.dispatchEvent(new Event("ka-contact-change"));
                    const inferred = getCountryFromPhone(next);
                    if (inferred && inferred !== form.country) {
                      setForm((prev) => ({ ...prev, country: inferred, timing: "" }));
                      window.localStorage.setItem("ka_country", inferred);
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

            <div className="space-y-2 md:col-span-1">
              <p className="select-none text-sm font-medium text-slate-800">
                Preferred Date
              </p>
              <input
                id="workshop-date"
                name="date"
                type="date"
                value={form.date}
                min={new Date().toISOString().split("T")[0]}
                onChange={onChange}
                aria-label="Preferred date"
                required
                className="block h-10 w-full cursor-pointer rounded-xl border border-slate-300 px-3 py-1.5 text-sm text-slate-900 outline-none ring-offset-2 transition focus:border-amber-500 focus:ring-2 focus:ring-amber-500 md:h-9 md:px-3 md:py-1"
              />
            </div>

            <div className="md:col-span-1">
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
                disabled={!form.country || !form.date}
                className="h-10 w-full rounded-xl border border-slate-300 px-3 py-1.5 text-sm text-slate-900 outline-none ring-offset-2 transition focus:border-amber-500 focus:ring-2 focus:ring-amber-500 disabled:cursor-not-allowed disabled:bg-slate-100 md:h-9 md:py-1"
              >
                <option value="">{form.country && form.date ? "Select Timing" : "Select Date and Contact First"}</option>
                {timingOptions.map((timing) => (
                  <option key={timing} value={timing}>
                    {timing}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-slate-500">{timingLabel}</p>
            </div>

            <div className="md:col-span-3">
              <button
                type="submit"
                disabled={submitting}
                className="rounded-2xl bg-amber-400 px-6 py-3 text-sm font-bold text-slate-900 transition hover:bg-amber-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {submitting ? "Submitting..." : "Reserve seats for your child"}
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
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-xl font-bold text-slate-900">Seat Reserved</h3>
            <p className="mt-3 text-sm leading-relaxed text-slate-700">
              Done. Please complete the payment to confirm your seat. We&apos;ll share the session link via email once the
              payment is completed.
            </p>
            <p className="mt-2 text-sm text-slate-700">For enquiry, hit the WhatsApp button or mail us.</p>
            <div className="mt-5 flex gap-3">
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
                className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800"
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



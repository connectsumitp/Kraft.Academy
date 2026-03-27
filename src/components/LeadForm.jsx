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

const programs = ["AI Future Skills", "Coding Bootcamp"];

export default function LeadForm() {
  const [form, setForm] = useState({
    name: "",
    contact: "",
    email: "",
    age: "",
    country: "",
    date: "",
    program: "",
    timing: "",
  });
  const [touched, setTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");
  const [geoCountry, setGeoCountry] = useState("");

  const isContactValid = useMemo(() => (form.contact ? isValidPhoneNumber(form.contact) : false), [form.contact]);
  const timingOptions = useMemo(() => getTimingOptions(form.country), [form.country]);
  const timingLabel = useMemo(() => getTimingTimezoneLabel(form.country), [form.country]);
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

    if (name === "program" && typeof window !== "undefined") {
      window.localStorage.setItem("ka_program", value);
    }

    if (typeof window !== "undefined" && ["name", "email", "age"].includes(name)) {
      window.localStorage.setItem(`ka_${name}`, value);
    }

    setForm((prev) => ({
      ...prev,
      [name]: value,
      timing: name === "timing" ? value : prev.timing,
    }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setTouched(true);
    setSubmitMessage("");

    if (!form.name || !form.age || !form.country || !form.program || !form.timing || !form.email || !isContactValid) {
      return;
    }

    const scriptUrl = import.meta.env.VITE_GOOGLE_SCRIPT_URL;
    if (!scriptUrl) {
      setSubmitMessage("Missing Google Sheet URL. Add VITE_GOOGLE_SCRIPT_URL to your .env file.");
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
        date: "",
        program: form.program,
        timing: form.timing,
        lead_type: "program",
        source: "website_program_form",
        created_at: new Date().toISOString(),
        payment_status: "",
      };

      const body = new URLSearchParams(payload).toString();

      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("ka-checkout-ready"));
        const target = document.getElementById("razorpay-checkout");
        if (target) {
          target.scrollIntoView({ behavior: "smooth", block: "start" });
          window.dispatchEvent(new Event("ka-razorpay-focus"));
          window.dispatchEvent(new CustomEvent("ka-razorpay-card-focus", { detail: { purpose: "program" } }));
        } else {
          window.location.hash = "#razorpay-checkout";
        }
        setSubmitMessage("Your details are saved. Complete the payment below to confirm your seat. We will follow up with the next steps on email.\n\nFor any enquiry, use the WhatsApp button or mail us.");
      } else {
        setSubmitMessage("Your details are saved successfully.");
      }

      fetch(scriptUrl, {
        method: "POST",
        mode: "no-cors",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
        },
        body,
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
        program: "",
        timing: "",
      }));
      setTouched(false);
    } catch (error) {
      setSubmitMessage("Submission failed. Check Apps Script deployment access and sheet name, then try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section id="registration" className="px-4 pb-16 pt-8 md:px-6" aria-labelledby="registration-title">
      <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
        <h2 id="registration-title" className="text-2xl font-bold text-slate-900 md:text-3xl">
          Program Enrollment Booking
        </h2>
        <p className="mt-2 text-sm text-slate-700">Choose your program and preferred timing to unlock the correct checkout option.</p>
        <p className="mt-2 text-xs font-semibold text-emerald-700">Programs run on weekends only, between 9 AM and 11 PM IST.</p>
        <p className="mt-2 text-xs font-medium text-slate-600">All fields are mandatory.</p>

        <form className="mt-6 grid gap-4" onSubmit={onSubmit} noValidate>
          <div>
            <label htmlFor="name" className="mb-1 block text-sm font-medium text-slate-800">
              Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              value={form.name}
              onChange={onChange}
              aria-label="Student name"
              required
              className="w-full rounded-xl border border-slate-300 px-4 py-2 text-slate-900 outline-none ring-offset-2 transition focus:border-amber-500 focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div>
            <label htmlFor="contact" className="mb-1 block text-sm font-medium text-slate-800">
              Contact
            </label>
            <PhoneInput
              id="contact"
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
                }));
                if (typeof window !== "undefined") {
                  window.localStorage.setItem("ka_contact", next);
                  window.dispatchEvent(new Event("ka-contact-change"));
                  if (inferred && inferred !== form.country) {
                    window.localStorage.setItem("ka_country", inferred);
                    window.localStorage.removeItem("ka_timing");
                    window.dispatchEvent(new Event("ka-country-change"));
                  } else if (!next) {
                    window.localStorage.removeItem("ka_country");
                    window.localStorage.removeItem("ka_timing");
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
            <label htmlFor="email" className="mb-1 block text-sm font-medium text-slate-800">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={form.email}
              onChange={onChange}
              aria-label="Email"
              required
              className="w-full rounded-xl border border-slate-300 px-4 py-2 text-slate-900 outline-none ring-offset-2 transition focus:border-amber-500 focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div>
            <label htmlFor="age" className="mb-1 block text-sm font-medium text-slate-800">
              Age
            </label>
            <select
              id="age"
              name="age"
              value={form.age}
              onChange={onChange}
              aria-label="Age"
              required
              className="w-full rounded-xl border border-slate-300 px-4 py-2 text-slate-900 outline-none ring-offset-2 transition focus:border-amber-500 focus:ring-2 focus:ring-amber-500"
            >
              <option value="">Select Age</option>
              {[11, 12, 13, 14, 15, 16, 17, 18].map((age) => (
                <option key={age} value={`${age}`}>
                  {age} years
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="program" className="mb-1 block text-sm font-medium text-slate-800">
              Select Program
            </label>
            <select
              id="program"
              name="program"
              value={form.program}
              onChange={onChange}
              aria-label="Select program"
              required
              className="w-full rounded-xl border border-slate-300 px-4 py-2 text-slate-900 outline-none ring-offset-2 transition focus:border-amber-500 focus:ring-2 focus:ring-amber-500"
            >
              <option value="">Select Program</option>
              {programs.map((program) => (
                <option key={program} value={program}>
                  {program}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="timing" className="mb-1 block text-sm font-medium text-slate-800">
              Timing
            </label>
            <select
              id="timing"
              name="timing"
              value={form.timing}
              onChange={onChange}
              aria-label="Select timing"
              required
              disabled={!isContactValid || !form.country}
              className="w-full rounded-xl border border-slate-300 px-4 py-2 text-slate-900 outline-none ring-offset-2 transition focus:border-amber-500 focus:ring-2 focus:ring-amber-500 disabled:cursor-not-allowed disabled:bg-slate-100"
              >
              <option value="">
                {isContactValid && form.country ? "Select Timing" : "Select Valid Contact First"}
              </option>
              {timingOptions.map((timing) => (
                <option key={timing} value={timing}>
                  {timing}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-slate-500">{timingLabel}</p>
          </div>

          {submitMessage && (
            <p className="text-sm font-medium text-slate-700" role="status" aria-live="polite">
              {submitMessage}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="mt-2 rounded-2xl bg-amber-400 px-6 py-3 text-sm font-bold text-slate-900 transition hover:bg-amber-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {submitting ? "Saving Details..." : "Continue to Program Checkout"}
          </button>
        </form>
      </div>
    </section>
  );
}




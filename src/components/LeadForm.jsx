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
    program: "",
    timing: "",
  });
  const [touched, setTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");

  const isContactValid = useMemo(() => (form.contact ? isValidPhoneNumber(form.contact) : false), [form.contact]);
  const timingOptions = useMemo(() => getTimingOptions(form.country), [form.country]);
  const timingLabel = useMemo(() => getTimingTimezoneLabel(form.country), [form.country]);
  const defaultCountry = useMemo(getDefaultCountry, []);

  useEffect(() => {
    if (!form.country && defaultCountry) {
      setForm((prev) => ({ ...prev, country: defaultCountry }));
      if (typeof window !== "undefined") {
        window.localStorage.setItem("ka_country", defaultCountry);
        window.dispatchEvent(new Event("ka-country-change"));
      }
    }
  }, [defaultCountry, form.country]);

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

    setForm((prev) => ({ ...prev, [name]: value }));
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
        program: form.program,
        timing: form.timing,
        lead_type: "program",
        source: "website_program_form",
        created_at: new Date().toISOString(),
        payment_status: "",
      };

      const body = new URLSearchParams(payload).toString();

      await fetch(scriptUrl, {
        method: "POST",
        mode: "no-cors",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
        },
        body,
      });

      if (typeof window !== "undefined") {
        window.location.hash = "#pricing";
        setSubmitMessage("Done. Please complete the payment to confirm your seat. We'll share the session link via email once the payment is completed.\n\nFor enquiry, hit the WhatsApp button or mail us.");
      } else {
        setSubmitMessage("Thanks! Your program enquiry is submitted successfully.");
      }
      setForm({ name: "", contact: "", email: "", age: "", country: "", program: "", timing: "" });
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
          Program Registration
        </h2>
        <p className="mt-2 text-sm text-slate-700">Fill details and our team will share program enrollment payment details on WhatsApp or Email.</p>
        <p className="mt-2 text-xs font-semibold text-emerald-700">Programs are available on weekends only.</p>

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
              defaultCountry={defaultCountry}
              countryCallingCodeEditable={false}
              countrySelectProps={{ "aria-label": "Country" }}
              placeholder="Enter contact number"
              value={form.contact}
              onChange={(value) => {
                const next = value || "";
                setForm((prev) => ({ ...prev, contact: next }));
                if (typeof window !== "undefined") {
                  window.localStorage.setItem("ka_contact", next);
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
              disabled={!form.country}
              className="w-full rounded-xl border border-slate-300 px-4 py-2 text-slate-900 outline-none ring-offset-2 transition focus:border-amber-500 focus:ring-2 focus:ring-amber-500 disabled:cursor-not-allowed disabled:bg-slate-100"
            >
              <option value="">{form.country ? "Select Timing" : "Select Country on Contact First"}</option>
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
            {submitting ? "Submitting..." : "Register in Program"}
          </button>
        </form>
      </div>
    </section>
  );
}










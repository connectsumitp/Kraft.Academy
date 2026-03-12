import { useMemo, useState } from "react";
import PhoneInput, { isValidPhoneNumber } from "react-phone-number-input";
import { countryOptions, getTimingOptions, getTimingTimezoneLabel } from "./countryTiming";

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

export default function WorkshopLeadForm() {
  const [form, setForm] = useState({
    name: "",
    contact: "",
    email: "",
    age: "",
    country: "",
    timing: "",
  });
  const [touched, setTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");

  const isContactValid = useMemo(() => (form.contact ? isValidPhoneNumber(form.contact) : false), [form.contact]);
  const timingOptions = useMemo(() => getTimingOptions(form.country), [form.country]);
  const timingLabel = useMemo(() => getTimingTimezoneLabel(form.country), [form.country]);
  const defaultCountry = useMemo(getDefaultCountry, []);

  const onChange = (e) => {
    const { name, value } = e.target;
    if (name === "country") {
      if (typeof window !== "undefined") {
        window.localStorage.setItem("ka_country", value);
        window.dispatchEvent(new Event("ka-country-change"));
      }
      setForm((prev) => ({ ...prev, country: value, timing: "" }));
      return;
    }
    if (name === "timing" && typeof window !== "undefined") {
      window.localStorage.setItem("ka_timing", value);
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

    if (!form.name || !form.age || !form.country || !form.timing || !form.email || !isContactValid) {
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
        timing: form.timing,
        program: "",
        lead_type: "workshop",
        source: "website_workshop_top_form",
        createdAt: new Date().toISOString(),
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

      setForm({ name: "", contact: "", email: "", age: "", country: "", timing: "" });
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

          <form className="mt-6 grid gap-4 md:grid-cols-3" onSubmit={onSubmit} noValidate>
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
                className="w-full rounded-xl border border-slate-300 px-4 py-2 text-slate-900 outline-none ring-offset-2 transition focus:border-amber-500 focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label htmlFor="workshop-contact" className="mb-1 block text-sm font-medium text-slate-800">
                Contact
              </label>
              <PhoneInput
                id="workshop-contact"
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
                className="w-full rounded-xl border border-slate-300 px-4 py-2 text-slate-900 outline-none ring-offset-2 transition focus:border-amber-500 focus:ring-2 focus:ring-amber-500"
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
              <label htmlFor="workshop-country" className="mb-1 block text-sm font-medium text-slate-800">
                Country
              </label>
              <select
                id="workshop-country"
                name="country"
                value={form.country}
                onChange={onChange}
                aria-label="Country"
                required
                className="w-full rounded-xl border border-slate-300 px-4 py-2 text-slate-900 outline-none ring-offset-2 transition focus:border-amber-500 focus:ring-2 focus:ring-amber-500"
              >
                <option value="">Select Country</option>
                {countryOptions.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.label}
                  </option>
                ))}
              </select>
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
                disabled={!form.country}
                className="w-full rounded-xl border border-slate-300 px-4 py-2 text-slate-900 outline-none ring-offset-2 transition focus:border-amber-500 focus:ring-2 focus:ring-amber-500 disabled:cursor-not-allowed disabled:bg-slate-100"
              >
                <option value="">{form.country ? "Select Timing" : "Select Country First"}</option>
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
              Your seat has been reserved. We&apos;ll contact you with the Workshop Date/Timing Link & Payment Link soon.
            </p>
            <p className="mt-2 text-sm text-slate-700">For enquiries, hit the WhatsApp or Email icon.</p>
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

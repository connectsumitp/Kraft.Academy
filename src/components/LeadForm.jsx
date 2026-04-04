import { useEffect, useMemo, useState } from "react";
import PhoneInput from "react-phone-number-input";
import { getProgramTimingOptions, getTimingTimezoneLabel } from "./countryTiming";
import { fetchAvailability } from "../lib/availability";
import { getCountryFromPhone, isAcceptableContactNumber } from "../lib/phoneCountry";
import { writeCheckoutSnapshot } from "../lib/checkoutSnapshot";

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

function normalizeCountryCode(value) {
  return String(value || "").trim().toUpperCase();
}

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
  const [geoCountry, setGeoCountry] = useState("");
  const [availabilityItems, setAvailabilityItems] = useState([]);

  const isContactValid = useMemo(() => (form.contact ? isAcceptableContactNumber(form.contact) : false), [form.contact]);
  const defaultCountry = useMemo(getDefaultCountry, []);
  const resolvedDefaultCountry = geoCountry || defaultCountry;
  const parsedPhoneCountry = useMemo(() => normalizeCountryCode(getCountryFromPhone(form.contact)), [form.contact]);
  const effectiveCountry = useMemo(
    () => parsedPhoneCountry || normalizeCountryCode(form.country) || normalizeCountryCode(resolvedDefaultCountry) || "US",
    [form.country, parsedPhoneCountry, resolvedDefaultCountry]
  );
  const timingOptions = useMemo(() => getProgramTimingOptions(effectiveCountry, availabilityItems), [effectiveCountry, availabilityItems]);
  const timingLabel = useMemo(() => getTimingTimezoneLabel(effectiveCountry, "", "program"), [effectiveCountry]);

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
    if (typeof window === "undefined") return undefined;

    const onProgramFocus = (event) => {
      const nextProgram = event?.detail?.program || "AI Future Skills";
      setForm((prev) => ({ ...prev, program: nextProgram }));
      window.localStorage.setItem("ka_program", nextProgram);
      window.requestAnimationFrame(() => {
        const target = document.getElementById("program-enrollment-panel");
        if (target) {
          target.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      });
    };

    window.addEventListener("ka-program-focus", onProgramFocus);
    return () => window.removeEventListener("ka-program-focus", onProgramFocus);
  }, []);

  const onChange = (event) => {
    const { name, value } = event.target;

    if (name === "timing" && typeof window !== "undefined") {
      window.localStorage.setItem("ka_timing", value);
      window.dispatchEvent(new Event("ka-checkout-invalidate"));
    }
    if (name === "program" && typeof window !== "undefined") {
      window.localStorage.setItem("ka_program", value);
      window.dispatchEvent(new Event("ka-checkout-invalidate"));
    }
    if (typeof window !== "undefined" && ["name", "email", "age"].includes(name)) {
      window.localStorage.setItem(`ka_${name}`, value);
      window.dispatchEvent(new Event("ka-checkout-invalidate"));
    }

    setForm((prev) => ({
      ...prev,
      [name]: value,
      timing: name === "timing" ? value : prev.timing,
    }));
  };

  const continueToProgramCheckout = async () => {
    setTouched(true);
    setSubmitMessage("");

    if (!form.name) {
      setSubmitMessage("Please enter the student name before continuing to checkout.");
      return;
    }
    if (!form.email) {
      setSubmitMessage("Please enter the email address before continuing to checkout.");
      return;
    }
    if (!isContactValid) {
      setSubmitMessage("Please enter a valid contact number before continuing to checkout.");
      return;
    }
    if (!form.age) {
      setSubmitMessage("Please select the student age before continuing to checkout.");
      return;
    }
    if (!form.program) {
      setSubmitMessage("Please select the program before continuing to checkout.");
      return;
    }
    if (!form.timing) {
      setSubmitMessage("Please select a weekend timing before continuing to checkout.");
      return;
    }
    if (!effectiveCountry) {
      setSubmitMessage("We could not detect the booking country. Please re-enter the contact number and try again.");
      return;
    }

    const scriptUrl = import.meta.env.VITE_GOOGLE_SCRIPT_URL;

    try {
      setSubmitting(true);
      const payload = {
        name: form.name,
        contact: form.contact,
        email: form.email,
        age: form.age,
        country: effectiveCountry,
        date: "",
        program: form.program,
        timing: form.timing,
        lead_type: "program",
        source: "website_program_form",
        created_at: new Date().toISOString(),
        payment_status: "",
      };

      if (typeof window !== "undefined") {
        window.localStorage.setItem("ka_name", form.name);
        window.localStorage.setItem("ka_contact", form.contact);
        window.localStorage.setItem("ka_email", form.email);
        window.localStorage.setItem("ka_age", form.age);
        window.localStorage.setItem("ka_country", effectiveCountry);
        window.localStorage.setItem("ka_program", form.program);
        window.localStorage.setItem("ka_timing", form.timing);
        window.localStorage.removeItem("ka_demo_slot");
        window.localStorage.removeItem("ka_workshop_slot_key");
        window.localStorage.setItem("ka_checkout_flow", "program");
        writeCheckoutSnapshot({
          ready: true,
          flow: "program",
          country: effectiveCountry,
          contact: form.contact,
          demoSlot: "",
          workshopSlotKey: "",
        });
        window.dispatchEvent(
          new CustomEvent("ka-checkout-snapshot", {
            detail: {
              flow: "program",
              country: effectiveCountry,
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
          window.dispatchEvent(new CustomEvent("ka-razorpay-card-focus", { detail: { purpose: "program" } }));
        } else {
          window.location.hash = "#razorpay-checkout";
        }
        setSubmitMessage(
          scriptUrl
            ? "Your program details are saved. Complete the payment below to confirm enrollment."
            : "Your program details are saved for checkout. Add VITE_GOOGLE_SCRIPT_URL to capture the lead in Google Sheets as well."
        );
      }

      if (scriptUrl) {
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
      }

    } catch {
      setSubmitMessage("Submission failed. Check Apps Script deployment access and sheet name, then try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section id="registration" className="px-4 pb-16 pt-8 md:px-6" aria-labelledby="registration-title">
      <div className="mx-auto max-w-4xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 id="registration-title" className="text-2xl font-bold text-slate-900 md:text-3xl">
              Program Enrollment Booking
            </h2>
            <p className="mt-2 text-sm text-slate-700">
              Weekend-only program bookings. Fill the enrollment form below to continue to checkout.
            </p>
            <p className="mt-2 text-xs font-semibold text-emerald-700">
              Program timings are available on weekends only, from 10 AM IST to 12 midnight IST, excluding 7-8 PM IST and 8-9 PM IST.
            </p>
          </div>
        </div>

        <div id="program-enrollment-panel" className="mt-6">
          <form
            className="grid gap-4 pb-1"
            onSubmit={(event) => {
              event.preventDefault();
              continueToProgramCheckout();
            }}
            noValidate
          >
            <p className="text-xs font-medium text-slate-600">All fields are mandatory.</p>

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
                  const inferred = normalizeCountryCode(getCountryFromPhone(next));
                  setForm((prev) => ({
                    ...prev,
                    contact: next,
                    country: inferred || (next ? prev.country || "" : ""),
                    timing: !next || (inferred && inferred !== prev.country) ? "" : prev.timing,
                  }));
                  if (typeof window !== "undefined") {
                    window.localStorage.setItem("ka_contact", next);
                    window.dispatchEvent(new Event("ka-contact-change"));
                    window.dispatchEvent(new Event("ka-checkout-invalidate"));
                    if (inferred && inferred !== form.country) {
                      window.localStorage.setItem("ka_country", inferred);
                      window.localStorage.removeItem("ka_timing");
                      window.dispatchEvent(new Event("ka-country-change"));
                      window.dispatchEvent(new Event("ka-checkout-invalidate"));
                    } else if (!next) {
                      window.localStorage.removeItem("ka_country");
                      window.localStorage.removeItem("ka_timing");
                      window.dispatchEvent(new Event("ka-country-change"));
                      window.dispatchEvent(new Event("ka-checkout-invalidate"));
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
                      window.dispatchEvent(new Event("ka-checkout-invalidate"));
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
                Weekend Timing
              </label>
              <select
                id="timing"
                name="timing"
                value={form.timing}
                onChange={onChange}
                aria-label="Select timing"
                required
                disabled={!isContactValid || !effectiveCountry}
                className="w-full rounded-xl border border-slate-300 px-4 py-2 text-slate-900 outline-none ring-offset-2 transition focus:border-amber-500 focus:ring-2 focus:ring-amber-500 disabled:cursor-not-allowed disabled:bg-slate-100"
              >
                <option value="">{isContactValid && effectiveCountry ? "Select Weekend Timing" : "Select Valid Contact First"}</option>
                {timingOptions.map((timing) => (
                  <option key={timing} value={timing}>
                    {timing}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-slate-500">{timingLabel}</p>
              {isContactValid && effectiveCountry && timingOptions.length === 0 && (
                <p className="mt-1 text-xs font-medium text-rose-700">
                  No weekend program timings are available right now for this setup.
                </p>
              )}
            </div>

            {submitMessage && (
              <p className="text-sm font-medium text-slate-700" role="status" aria-live="polite">
                {submitMessage}
              </p>
            )}

            <button
              type="button"
              onClick={continueToProgramCheckout}
              disabled={submitting}
              className="mt-2 rounded-2xl bg-amber-400 px-6 py-3 text-sm font-bold text-slate-900 transition hover:bg-amber-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {submitting ? "Saving Details..." : "Continue to Program Checkout"}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}

import { useMemo, useState } from "react";

export default function WorkshopLeadForm() {
  const [form, setForm] = useState({ name: "", whatsapp: "", grade: "" });
  const [touched, setTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");

  const isWhatsappValid = useMemo(() => /^\d{10}$/.test(form.whatsapp), [form.whatsapp]);

  const onChange = (e) => {
    const { name, value } = e.target;
    if (name === "whatsapp") {
      setForm((prev) => ({ ...prev, whatsapp: value.replace(/\D/g, "").slice(0, 10) }));
      return;
    }
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setTouched(true);
    setSubmitMessage("");

    if (!form.name || !form.grade || !isWhatsappValid) {
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
        whatsapp: form.whatsapp,
        grade: form.grade,
        program: "",
        timing: "",
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

      setForm({ name: "", whatsapp: "", grade: "" });
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
            Reserve Seat for AI Workshop @ ₹99
          </h2>
          <p className="mt-2 text-sm text-slate-700">AI Study Skills Workshop for Students (Grades 6th to 12th).</p>
          <p className="mt-2 inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-slate-900">
            Includes AI Study Toolkit (Worth Rs 499)
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
                aria-label="Workshop student name"
                required
                className="w-full rounded-xl border border-slate-300 px-4 py-2 text-slate-900 outline-none ring-offset-2 transition focus:border-amber-500 focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label htmlFor="workshop-whatsapp" className="mb-1 block text-sm font-medium text-slate-800">
                WhatsApp Number
              </label>
              <input
                id="workshop-whatsapp"
                name="whatsapp"
                type="tel"
                inputMode="numeric"
                value={form.whatsapp}
                onChange={onChange}
                aria-label="Workshop WhatsApp number"
                required
                className="w-full rounded-xl border border-slate-300 px-4 py-2 text-slate-900 outline-none ring-offset-2 transition focus:border-amber-500 focus:ring-2 focus:ring-amber-500"
              />
              {touched && !isWhatsappValid && (
                <p className="mt-1 text-sm font-medium text-rose-700">Enter a valid 10-digit WhatsApp number.</p>
              )}
            </div>

            <div>
              <label htmlFor="workshop-grade" className="mb-1 block text-sm font-medium text-slate-800">
                Grade
              </label>
              <select
                id="workshop-grade"
                name="grade"
                value={form.grade}
                onChange={onChange}
                aria-label="Workshop grade"
                required
                className="w-full rounded-xl border border-slate-300 px-4 py-2 text-slate-900 outline-none ring-offset-2 transition focus:border-amber-500 focus:ring-2 focus:ring-amber-500"
              >
                <option value="">Select Grade</option>
                {[6, 7, 8, 9, 10, 11, 12].map((g) => (
                  <option key={g} value={`Grade ${g}`}>
                    Grade {g}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-3">
              <button
                type="submit"
                disabled={submitting}
                className="rounded-2xl bg-amber-400 px-6 py-3 text-sm font-bold text-slate-900 transition hover:bg-amber-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {submitting ? "Submitting..." : "Reserve Seat for AI Workshop @ ₹99"}
              </button>
              <p className="mt-2 text-xs text-slate-600">Full refund if not satisified with the workshop.*</p>
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
              Your seat has been reserved. We&apos;ll WhatsApp you with the Workshop Date/Timing Link & Payment Link soon.
            </p>
            <p className="mt-2 text-sm text-slate-700">For enquiries, hit the WhatsApp icon.</p>
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

import { useMemo, useState } from "react";

const programs = ["AI Future Skills", "Coding Bootcamp"];

const timingOptionsByProgram = {
  "AI Future Skills": ["6 PM- 7 PM", "7 PM- 8 PM", "8 PM- 9 PM"],
  "Coding Bootcamp": ["9 AM- 10 AM", "10 AM-11 AM", "7 PM- 8 PM", "6 PM-7 PM"],
};

export default function LeadForm() {
  const [form, setForm] = useState({
    name: "",
    grade: "",
    whatsapp: "",
    program: "",
    timing: "",
  });
  const [touched, setTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");

  const isWhatsappValid = useMemo(() => /^\d{10}$/.test(form.whatsapp), [form.whatsapp]);
  const timingOptions = useMemo(() => timingOptionsByProgram[form.program] || [], [form.program]);

  const onChange = (e) => {
    const { name, value } = e.target;

    if (name === "whatsapp") {
      setForm((prev) => ({ ...prev, [name]: value.replace(/\D/g, "").slice(0, 10) }));
      return;
    }

    if (name === "program") {
      setForm((prev) => ({ ...prev, program: value, timing: "" }));
      return;
    }

    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setTouched(true);
    setSubmitMessage("");

    if (!form.name || !form.grade || !form.program || !form.timing || !isWhatsappValid) {
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
        grade: form.grade,
        whatsapp: form.whatsapp,
        program: form.program,
        timing: form.timing,
        lead_type: "program",
        source: "website_program_form",
        createdAt: new Date().toISOString(),
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

      setSubmitMessage("Thanks! Your program enquiry is submitted successfully.");
      setForm({ name: "", grade: "", whatsapp: "", program: "", timing: "" });
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
        <p className="mt-2 text-sm text-slate-700">Fill details and our team will share program enrollment payment details on WhatsApp.</p>

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
            <label htmlFor="grade" className="mb-1 block text-sm font-medium text-slate-800">
              Grade
            </label>
            <select
              id="grade"
              name="grade"
              value={form.grade}
              onChange={onChange}
              aria-label="Select grade"
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

          <div>
            <label htmlFor="whatsapp" className="mb-1 block text-sm font-medium text-slate-800">
              WhatsApp Number
            </label>
            <input
              id="whatsapp"
              name="whatsapp"
              inputMode="numeric"
              type="tel"
              value={form.whatsapp}
              onChange={onChange}
              aria-label="WhatsApp number"
              required
              className="w-full rounded-xl border border-slate-300 px-4 py-2 text-slate-900 outline-none ring-offset-2 transition focus:border-amber-500 focus:ring-2 focus:ring-amber-500"
            />
            {touched && !isWhatsappValid && (
              <p className="mt-1 text-sm font-medium text-rose-700">Enter a valid 10-digit WhatsApp number.</p>
            )}
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
              disabled={!form.program}
              className="w-full rounded-xl border border-slate-300 px-4 py-2 text-slate-900 outline-none ring-offset-2 transition focus:border-amber-500 focus:ring-2 focus:ring-amber-500 disabled:cursor-not-allowed disabled:bg-slate-100"
            >
              <option value="">{form.program ? "Select Timing" : "Select Program First"}</option>
              {timingOptions.map((timing) => (
                <option key={timing} value={timing}>
                  {timing}
                </option>
              ))}
            </select>
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

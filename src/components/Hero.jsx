import { useEffect, useMemo, useState } from "react";
import PhoneInput, { isValidPhoneNumber } from "react-phone-number-input";
import BrandName from "./BrandName.jsx";
import kid from "../assets/kid.png";

const demoSlots = [
  {
    id: "group-7-8",
    title: "Group Booking",
    time: "7:00 PM - 8:00 PM (IST)",
    startMinutes: 19 * 60,
  },
  {
    id: "group-8-9",
    title: "Group Booking",
    time: "8:00 PM - 9:00 PM (IST)",
    startMinutes: 20 * 60,
  },
];

const IST_TIME_ZONE = "Asia/Kolkata";

function getIstNowParts() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: IST_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date());

  const lookup = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return {
    year: Number(lookup.year),
    month: Number(lookup.month),
    day: Number(lookup.day),
    hour: Number(lookup.hour),
    minute: Number(lookup.minute),
  };
}

function getFormattedDateInfo(offsetDays = 0) {
  const now = new Date();
  const shifted = new Date(now.getTime() + offsetDays * 24 * 60 * 60 * 1000);
  const isoDate = new Intl.DateTimeFormat("en-CA", {
    timeZone: IST_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(shifted);
  const longDate = new Intl.DateTimeFormat("en-GB", {
    timeZone: IST_TIME_ZONE,
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(shifted);

  return { isoDate, longDate };
}

function getSlotSchedule(slot) {
  const now = getIstNowParts();
  const currentMinutes = now.hour * 60 + now.minute;
  const isNextDay = currentMinutes >= slot.startMinutes;
  const dateInfo = getFormattedDateInfo(isNextDay ? 1 : 0);

  return {
    ...dateInfo,
    dayLabel: isNextDay ? "Tomorrow" : "Today",
  };
}

function scrollToRazorpaySection() {
  if (typeof window === "undefined") return;

  window.location.hash = "#razorpay-checkout";
  const runScroll = () => {
    const target = document.getElementById("razorpay-checkout");
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
      window.dispatchEvent(new Event("ka-razorpay-focus"));
      window.dispatchEvent(new CustomEvent("ka-razorpay-card-focus", { detail: { purpose: "workshop" } }));
    }
  };

  window.requestAnimationFrame(runScroll);
  window.setTimeout(runScroll, 180);
}

export default function Hero() {
  const [demoForm, setDemoForm] = useState({
    name: "",
    email: "",
    contact: "",
  });
  const [touched, setTouched] = useState(false);
  const [bookingMessage, setBookingMessage] = useState("");
  const [bookingBusy, setBookingBusy] = useState(false);
  const [isDemoHighlighted, setIsDemoHighlighted] = useState(false);

  const isIndianContact = useMemo(
    () => Boolean(demoForm.contact && demoForm.contact.startsWith("+91") && isValidPhoneNumber(demoForm.contact)),
    [demoForm.contact]
  );

  const slotSchedules = demoSlots.map((slot) => ({ ...slot, schedule: getSlotSchedule(slot) }));

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const onDemoFocus = () => {
      setIsDemoHighlighted(true);
      window.setTimeout(() => setIsDemoHighlighted(false), 2200);
    };

    window.addEventListener("ka-demo-focus", onDemoFocus);
    return () => {
      window.removeEventListener("ka-demo-focus", onDemoFocus);
    };
  }, []);

  const handleDemoSlotClick = async (slot) => {
    setTouched(true);
    setBookingMessage("");

    if (!demoForm.name || !demoForm.email || !isIndianContact) {
      setBookingMessage("Enter name, email, and a valid Indian contact number to continue with the demo slot booking.");
      return;
    }

    const scriptUrl = import.meta.env.VITE_GOOGLE_SCRIPT_URL;
    const schedule = slot.schedule;
    const selectedSlotLabel = `${slot.title} | ${schedule.dayLabel} | ${schedule.longDate} | ${slot.time}`;

    if (typeof window !== "undefined") {
      window.localStorage.setItem("ka_name", demoForm.name);
      window.localStorage.setItem("ka_email", demoForm.email);
      window.localStorage.setItem("ka_contact", demoForm.contact);
      window.localStorage.setItem("ka_country", "IN");
      window.localStorage.setItem("ka_date", schedule.isoDate);
      window.localStorage.setItem("ka_timing", slot.time);
      window.localStorage.removeItem("ka_program");
      window.localStorage.setItem("ka_demo_slot", selectedSlotLabel);
      window.dispatchEvent(new Event("ka-contact-change"));
      window.dispatchEvent(new Event("ka-country-change"));
      window.dispatchEvent(new Event("ka-date-change"));
      window.dispatchEvent(new Event("ka-demo-slot-change"));
      window.dispatchEvent(new Event("ka-checkout-ready"));
    }

    setBookingMessage(`Demo slot selected for ${schedule.dayLabel.toLowerCase()}, ${schedule.longDate}. Continue below to complete the Rs 99 India payment.`);
    setBookingBusy(true);
    scrollToRazorpaySection();

    try {
      if (scriptUrl) {
        const payload = {
          name: demoForm.name,
          contact: demoForm.contact,
          email: demoForm.email,
          age: "",
          country: "IN",
          date: schedule.isoDate,
          timing: slot.time,
          program: "",
          lead_type: "workshop",
          source: "website_demo_slot_top_form",
          created_at: new Date().toISOString(),
          payment_status: "",
        };

        fetch(scriptUrl, {
          method: "POST",
          mode: "no-cors",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
          },
          body: new URLSearchParams(payload).toString(),
        }).catch(() => {
          setBookingMessage("We saved your demo slot details, but lead submission could not be confirmed. You can still continue to payment below.");
        });
      }
    } finally {
      window.setTimeout(() => setBookingBusy(false), 250);
    }
  };

  return (
    <section className="relative overflow-hidden px-4 pb-14 pt-8 md:px-6 md:pt-10" aria-labelledby="hero-heading">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_12%_18%,rgba(15,23,42,0.16),transparent_26%),radial-gradient(circle_at_78%_12%,rgba(251,191,36,0.26),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.45),transparent_80%)]" />
      <div className="mx-auto grid max-w-6xl items-center gap-12 md:grid-cols-[1.05fr_0.95fr]">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center rounded-full bg-white/80 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.22em] text-slate-700 shadow-sm ring-1 ring-slate-200/80 backdrop-blur">
              AI Demo + Study Skills
            </span>
            <span className="inline-flex animate-verticalBounce items-center rounded-full bg-amber-100 px-4 py-1.5 text-sm font-semibold text-slate-800 shadow-sm ring-1 ring-amber-200">
              Limited Seats Available
            </span>
          </div>

          <p className="mt-6 max-w-lg text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            Live workshop for students ages 11-18
          </p>

          <h1 id="hero-heading" className="mt-3 max-w-3xl text-4xl font-extrabold leading-[0.98] tracking-[-0.04em] text-slate-950 md:text-6xl">
            Help your child learn AI tools with clarity, confidence, and real academic use.
          </h1>

          <p className="mt-5 max-w-xl text-base leading-relaxed text-slate-700 md:text-lg">
            <span className="font-semibold text-slate-900">Kraft Academy</span> helps students use AI for smarter study workflows, better revision, and practical future-ready skills without overwhelm.
          </p>

          <div className="mt-7 grid max-w-2xl gap-3 sm:grid-cols-3">
            <div className="editorial-panel rounded-[1.35rem] px-4 py-4">
              <p className="text-2xl font-extrabold tracking-[-0.04em] text-slate-950">11-18</p>
              <p className="mt-1 text-xs font-medium uppercase tracking-[0.16em] text-slate-500">Age group</p>
            </div>
            <div className="editorial-panel rounded-[1.35rem] px-4 py-4">
              <p className="text-2xl font-extrabold tracking-[-0.04em] text-slate-950">2 Slots</p>
              <p className="mt-1 text-xs font-medium uppercase tracking-[0.16em] text-slate-500">Daily India demos</p>
            </div>
            <div className="editorial-panel rounded-[1.35rem] px-4 py-4">
              <p className="text-2xl font-extrabold tracking-[-0.04em] text-slate-950">Rs 99</p>
              <p className="mt-1 text-xs font-medium uppercase tracking-[0.16em] text-slate-500">Group demo price</p>
            </div>
          </div>

          <div
            id="india-demo-classes"
            className={`mt-8 rounded-[2rem] border bg-white/90 p-4 shadow-[0_24px_60px_rgba(250,204,21,0.16)] backdrop-blur transition md:p-6 ${
              isDemoHighlighted ? "animate-pulseSoft border-amber-300 ring-2 ring-amber-300 shadow-xl shadow-amber-200/70" : "border-amber-200"
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex rounded-full bg-slate-900 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-white">
                  India Group Demo Classes
                </span>
                <span className="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                  Everyday booking
                </span>
              </div>
              <span className="inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-slate-900">
                Fastest way to book
              </span>
            </div>

            <p className="mt-4 max-w-2xl text-sm font-semibold leading-relaxed text-slate-900 md:text-base">
              Pick a live group demo slot for India and continue straight to the Rs 99 checkout.
            </p>
            <p className="mt-2 text-xs font-medium text-slate-600">Enter name, email, and a valid Indian contact number to unlock these demo slots.</p>

            <div className="mt-5 grid gap-3 xl:grid-cols-3">
              <input
                type="text"
                value={demoForm.name}
                onChange={(event) => setDemoForm((prev) => ({ ...prev, name: event.target.value }))}
                placeholder="Student name"
                aria-label="Demo booking name"
                className="h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-900 outline-none ring-offset-2 transition focus:border-amber-500 focus:ring-2 focus:ring-amber-500"
              />
              <input
                type="email"
                value={demoForm.email}
                onChange={(event) => setDemoForm((prev) => ({ ...prev, email: event.target.value }))}
                placeholder="Parent email"
                aria-label="Demo booking email"
                className="h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-900 outline-none ring-offset-2 transition focus:border-amber-500 focus:ring-2 focus:ring-amber-500"
              />
              <div>
                <PhoneInput
                  international
                  defaultCountry="IN"
                  country="IN"
                  countries={["IN"]}
                  countryCallingCodeEditable={false}
                  countrySelectProps={{ "aria-label": "India" }}
                  placeholder="Indian contact number"
                  value={demoForm.contact}
                  onChange={(value) => setDemoForm((prev) => ({ ...prev, contact: value || "" }))}
                  className="phone-input bg-white"
                  aria-label="Indian contact number"
                />
              </div>
            </div>

            {touched && !isIndianContact && (
              <p className="mt-2 text-sm font-medium text-rose-700">Please enter a valid Indian contact number for demo class booking.</p>
            )}

            <div className="mt-5 grid gap-3 lg:grid-cols-2">
              {slotSchedules.map((slot, index) => (
                <button
                  key={slot.id}
                  type="button"
                  onClick={() => handleDemoSlotClick(slot)}
                  className={`group relative overflow-hidden rounded-[1.6rem] border border-amber-200 bg-[linear-gradient(180deg,#fffef8_0%,#fff4cc_100%)] px-4 py-4 text-left shadow-sm transition hover:-translate-y-1 hover:border-amber-300 hover:shadow-[0_20px_40px_rgba(251,191,36,0.16)] focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 ${
                    index === 0 ? "animate-pulseSoft" : "animate-verticalBounce"
                  }`}
                >
                  <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-white/80" />
                  <span className="inline-flex rounded-full bg-white px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-700 shadow-sm sm:text-[11px]">
                    {slot.schedule.dayLabel} • {slot.schedule.longDate}
                  </span>
                  <div className="mt-3 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-600">{slot.title}</p>
                      <p className="mt-1 text-lg font-extrabold leading-tight tracking-[-0.03em] text-slate-950">{slot.time}</p>
                    </div>
                    <span className="inline-flex w-fit rounded-full bg-slate-900 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-white">
                      Rs 99
                    </span>
                  </div>
                  <p className="mt-2 text-xs font-medium leading-relaxed text-slate-700 transition group-hover:text-slate-900">
                    Tap to continue to India checkout for Rs 99
                  </p>
                </button>
              ))}
            </div>

            {bookingMessage && (
              <p className="mt-4 text-sm font-medium text-slate-700" role="status" aria-live="polite">
                {bookingMessage}
              </p>
            )}

            <div className="mt-5 flex flex-col gap-2 text-sm text-slate-700">
              <p>
                Need a 1:1 demo at your preferred time?{" "}
                <a href="#workshop-form" className="font-semibold text-slate-900 underline decoration-amber-400 underline-offset-4">
                  Book it in the preferred timing section below.
                </a>
              </p>
              <a
                href="#workshop-form"
                className="inline-flex w-fit items-center gap-2 rounded-full bg-slate-900 px-3 py-1.5 font-semibold text-white shadow-sm shadow-slate-300/40 transition hover:bg-slate-800"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
                  <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2Zm6.93 9h-3.27a15.72 15.72 0 0 0-1.18-4.57A8.05 8.05 0 0 1 18.93 11ZM12 4.07c.88 1.09 1.89 3.43 2.27 6.93H9.73C10.11 7.5 11.12 5.16 12 4.07ZM4.48 13h3.28A15.72 15.72 0 0 0 8.93 17.57 8.05 8.05 0 0 1 4.48 13Zm3.28-2H4.48a8.05 8.05 0 0 1 4.45-4.57A15.72 15.72 0 0 0 7.76 11Zm1.97 0a13.79 13.79 0 0 1 2.27-6.53A13.79 13.79 0 0 1 14.27 11Zm4.54 2A13.79 13.79 0 0 1 12 19.53 13.79 13.79 0 0 1 9.73 13Zm1.39 4.57A15.72 15.72 0 0 0 16.24 13h3.28a8.05 8.05 0 0 1-4.45 4.57Z" />
                </svg>
                Global students? Book your preferred timing here.
              </a>
            </div>
          </div>
        </div>

        <div className="relative">
          <div className="absolute -left-5 top-10 hidden h-28 w-28 rounded-[2rem] border border-white/70 bg-white/60 shadow-lg backdrop-blur md:block" aria-hidden="true" />
          <div className="absolute -bottom-5 right-3 hidden h-20 w-20 rounded-[1.7rem] bg-amber-300/40 blur-[2px] md:block" aria-hidden="true" />
          <div className="editorial-panel overflow-hidden rounded-[2.4rem] p-3 shadow-[0_30px_80px_rgba(15,23,42,0.16)]">
            <div className="mb-3 flex items-center justify-between rounded-[1.3rem] border border-slate-200/80 bg-white/85 px-4 py-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">Live class experience</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">Practical learning for real academic use</p>
              </div>
              <span className="inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-slate-900">
                Guided
              </span>
            </div>
            <div className="aspect-[16/10] w-full overflow-hidden rounded-[1.8rem] bg-slate-100">
              <img src={kid} alt="Student learning coding on a laptop" className="h-full w-full object-cover" />
            </div>
            <div className="mt-3 grid grid-cols-3 gap-3">
              <div className="rounded-[1.2rem] border border-slate-200/80 bg-white/85 px-3 py-3">
                <p className="text-lg font-extrabold tracking-[-0.04em] text-slate-950">AI</p>
                <p className="mt-1 text-[11px] uppercase tracking-[0.16em] text-slate-500">Prompt skills</p>
              </div>
              <div className="rounded-[1.2rem] border border-slate-200/80 bg-white/85 px-3 py-3">
                <p className="text-lg font-extrabold tracking-[-0.04em] text-slate-950">Live</p>
                <p className="mt-1 text-[11px] uppercase tracking-[0.16em] text-slate-500">Interactive sessions</p>
              </div>
              <div className="rounded-[1.2rem] border border-slate-200/80 bg-white/85 px-3 py-3">
                <p className="text-lg font-extrabold tracking-[-0.04em] text-slate-950">Smart</p>
                <p className="mt-1 text-[11px] uppercase tracking-[0.16em] text-slate-500">Study systems</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

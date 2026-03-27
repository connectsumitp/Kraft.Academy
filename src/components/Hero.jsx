import { useMemo, useState } from "react";
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

  const isIndianContact = useMemo(
    () => Boolean(demoForm.contact && demoForm.contact.startsWith("+91") && isValidPhoneNumber(demoForm.contact)),
    [demoForm.contact]
  );

  const slotSchedules = demoSlots.map((slot) => ({ ...slot, schedule: getSlotSchedule(slot) }));
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
    <section className="relative overflow-hidden px-4 pb-14 pt-10 md:px-6 md:pt-14" aria-labelledby="hero-heading">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_15%_15%,rgba(30,41,59,0.14),transparent_30%),radial-gradient(circle_at_80%_20%,rgba(251,191,36,0.24),transparent_35%)]" />
      <div className="mx-auto grid max-w-6xl items-center gap-10 md:grid-cols-2">
        <div>
          <span className="inline-flex animate-verticalBounce items-center rounded-full bg-amber-100 px-4 py-1 text-sm font-semibold text-slate-800">
            Limited Seats Available
          </span>

          <h1 id="hero-heading" className="mt-5 text-3xl font-extrabold leading-tight text-slate-900 md:text-5xl">
            <span className="inline-flex items-center">
              <BrandName textClassName="leading-none" logoClassName="h-[2.25em] w-[2.25em]" />
            </span>{" "}
            Power Yourself for Future
          </h1>

          <p className="mt-5 max-w-xl text-base leading-relaxed text-slate-700 md:text-lg">
            AI Study Skills Workshop for Students in Ages 11-18. Learn practical AI tools for smarter learning and exam prep.
          </p>

          <div className="mt-7 rounded-[1.75rem] border border-amber-200 bg-white/90 p-4 shadow-lg shadow-amber-100/60 backdrop-blur md:p-5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex animate-verticalBounce rounded-full bg-amber-100 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-slate-800">
                India Demo Classes
              </span>
              <span className="inline-flex animate-pulse rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                Everyday booking
              </span>
            </div>
            <p className="mt-3 max-w-2xl text-sm font-semibold leading-relaxed text-slate-900 md:text-base">
              Book a demo class for India and continue to the Rs 99 Indian payment section.
            </p>
            <p className="mt-2 text-xs font-medium text-slate-600">Name, Email, and a valid Indian contact number are mandatory for demo bookings.</p>

            <div className="mt-4 grid gap-3 xl:grid-cols-3">
              <input
                type="text"
                value={demoForm.name}
                onChange={(event) => setDemoForm((prev) => ({ ...prev, name: event.target.value }))}
                placeholder="Name"
                aria-label="Demo booking name"
                className="h-11 w-full rounded-xl border border-slate-300 px-4 text-sm text-slate-900 outline-none ring-offset-2 transition focus:border-amber-500 focus:ring-2 focus:ring-amber-500"
              />
              <input
                type="email"
                value={demoForm.email}
                onChange={(event) => setDemoForm((prev) => ({ ...prev, email: event.target.value }))}
                placeholder="Email"
                aria-label="Demo booking email"
                className="h-11 w-full rounded-xl border border-slate-300 px-4 text-sm text-slate-900 outline-none ring-offset-2 transition focus:border-amber-500 focus:ring-2 focus:ring-amber-500"
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
                  className="phone-input"
                  aria-label="Indian contact number"
                />
              </div>
            </div>

            {touched && !isIndianContact && (
              <p className="mt-2 text-sm font-medium text-rose-700">Please enter a valid Indian contact number for demo class booking.</p>
            )}

            <div className="mt-4 grid gap-3 lg:grid-cols-2">
              {slotSchedules.map((slot, index) => (
                <button
                  key={slot.id}
                  type="button"
                  onClick={() => handleDemoSlotClick(slot)}
                  className={`group rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-left shadow-sm transition hover:-translate-y-1 hover:border-amber-300 hover:bg-amber-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 ${
                    index === 0 ? "animate-pulseSoft" : "animate-verticalBounce"
                  }`}
                >
                  <span className="inline-flex rounded-full bg-white px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-700 sm:text-[11px]">
                    {slot.schedule.dayLabel} • {slot.schedule.longDate}
                  </span>
                  <div className="mt-3 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-600">{slot.title}</p>
                      <p className="mt-1 text-lg font-extrabold leading-tight text-slate-900">{slot.time}</p>
                    </div>
                    <span className="inline-flex w-fit rounded-full bg-amber-200 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-900">
                      Rs 99
                    </span>
                  </div>
                  <p className="mt-2 text-xs font-medium leading-relaxed text-slate-700 transition group-hover:text-slate-900">
                    Tap to continue to India payment (Rs 99)
                  </p>
                </button>
              ))}
            </div>

            {bookingMessage && (
              <p className="mt-4 text-sm font-medium text-slate-700" role="status" aria-live="polite">
                {bookingMessage}
              </p>
            )}

            <div className="mt-4 flex flex-col gap-2 text-sm text-slate-700">
              <p>
                Want your preferred timing for demo classes 1:1?{" "}
                <a href="#workshop-form" className="font-semibold text-slate-900 underline decoration-amber-400 underline-offset-4">
                  This is already available in the demo class booking section.
                </a>
              </p>
              <a
                href="#workshop-form"
                className="inline-flex w-fit animate-pulseSoft items-center gap-2 rounded-full bg-amber-100 px-3 py-1.5 font-semibold text-slate-900 shadow-sm shadow-amber-200/70 transition hover:bg-amber-200"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
                  <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2Zm6.93 9h-3.27a15.72 15.72 0 0 0-1.18-4.57A8.05 8.05 0 0 1 18.93 11ZM12 4.07c.88 1.09 1.89 3.43 2.27 6.93H9.73C10.11 7.5 11.12 5.16 12 4.07ZM4.48 13h3.28A15.72 15.72 0 0 0 8.93 17.57 8.05 8.05 0 0 1 4.48 13Zm3.28-2H4.48a8.05 8.05 0 0 1 4.45-4.57A15.72 15.72 0 0 0 7.76 11Zm1.97 0a13.79 13.79 0 0 1 2.27-6.53A13.79 13.79 0 0 1 14.27 11Zm4.54 2A13.79 13.79 0 0 1 12 19.53 13.79 13.79 0 0 1 9.73 13Zm1.39 4.57A15.72 15.72 0 0 0 16.24 13h3.28a8.05 8.05 0 0 1-4.45 4.57Z" />
                </svg>
                Global students? We have you covered.
              </a>
            </div>
          </div>
        </div>

        <div className="relative">
          <div className="absolute -left-3 -top-3 hidden h-20 w-20 rounded-3xl bg-amber-300/60 md:block" aria-hidden="true" />
          <div className="absolute -bottom-4 -right-2 hidden h-14 w-14 rounded-2xl bg-slate-900/20 md:block" aria-hidden="true" />
          <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white p-3 shadow-xl shadow-slate-900/15">
            <div className="aspect-[16/10] w-full overflow-hidden rounded-[1.4rem] bg-slate-100">
              <img src={kid} alt="Student learning coding on a laptop" className="h-full w-full object-cover" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}



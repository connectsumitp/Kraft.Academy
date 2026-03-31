import { useEffect, useMemo, useState } from "react";
import PhoneInput, { isValidPhoneNumber } from "react-phone-number-input";
import kid from "../assets/kid.png";
import { getWorkshopGroupSlots } from "./countryTiming";
import { fetchWorkshopSeats } from "../lib/workshopSeats";
import { fetchAvailability } from "../lib/availability";

function scrollToCheckout() {
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

function scrollToProgramRegistration() {
  if (typeof window === "undefined") return;

  window.location.hash = "#registration";
  window.dispatchEvent(new CustomEvent("ka-program-focus", { detail: { program: "AI Future Skills" } }));

  const runScroll = () => {
    const target = document.getElementById("registration");
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
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
  const [isDemoHighlighted, setIsDemoHighlighted] = useState(false);
  const [seatMap, setSeatMap] = useState({});
  const [availabilityItems, setAvailabilityItems] = useState([]);
  const workshopDays = useMemo(() => getWorkshopGroupSlots(availabilityItems), [availabilityItems]);

  const isIndianContact = useMemo(
    () => Boolean(demoForm.contact && demoForm.contact.startsWith("+91") && isValidPhoneNumber(demoForm.contact)),
    [demoForm.contact]
  );

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
    const loadSeats = async () => {
      const slotKeys = workshopDays.flatMap((day) => day.slots.map((slot) => slot.slotKey));
      const seats = await fetchWorkshopSeats(slotKeys);
      if (active) {
        setSeatMap(seats);
      }
    };

    loadSeats();

    if (typeof window === "undefined") return () => {
      active = false;
    };

    const onSeatUpdate = (event) => {
      const slotKey = event?.detail?.slotKey;
      const seatsLeft = event?.detail?.seatsLeft;
      if (!slotKey || typeof seatsLeft !== "number") return;
      setSeatMap((prev) => ({ ...prev, [slotKey]: Math.max(0, seatsLeft) }));
    };

    const onDemoFocus = () => {
      setIsDemoHighlighted(true);
      window.setTimeout(() => setIsDemoHighlighted(false), 2200);
    };

    window.addEventListener("ka-workshop-seat-update", onSeatUpdate);
    window.addEventListener("ka-demo-focus", onDemoFocus);

    return () => {
      active = false;
      window.removeEventListener("ka-workshop-seat-update", onSeatUpdate);
      window.removeEventListener("ka-demo-focus", onDemoFocus);
    };
  }, [workshopDays]);

  const handleDemoSlotClick = async (slot) => {
    setTouched(true);
    setBookingMessage("");

    if (!demoForm.name || !demoForm.email || !isIndianContact) {
      setBookingMessage("Enter name, email, and a valid Indian contact number to continue with the demo slot booking.");
      return;
    }

    const seatsLeft = Number(seatMap[slot.slotKey] ?? 15);
    if (slot.isClosedForTime) {
      setBookingMessage("This workshop slot has already closed. Please choose another workshop slot.");
      return;
    }
    if (seatsLeft <= 0) {
      setBookingMessage("This workshop slot is full. Please choose another workshop slot.");
      return;
    }

    const scriptUrl = import.meta.env.VITE_GOOGLE_SCRIPT_URL;
    const selectedSlotLabel = `${slot.weekdayLabel} | ${slot.longDate} | ${slot.time}`;

    if (typeof window !== "undefined") {
      window.localStorage.setItem("ka_name", demoForm.name);
      window.localStorage.setItem("ka_email", demoForm.email);
      window.localStorage.setItem("ka_contact", demoForm.contact);
      window.localStorage.setItem("ka_country", "IN");
      window.localStorage.setItem("ka_date", slot.isoDate);
      window.localStorage.setItem("ka_timing", slot.time);
      window.localStorage.removeItem("ka_program");
      window.localStorage.setItem("ka_demo_slot", selectedSlotLabel);
      window.localStorage.setItem("ka_workshop_slot_key", slot.slotKey);
      window.localStorage.setItem("ka_checkout_flow", "workshop");
      window.dispatchEvent(new Event("ka-contact-change"));
      window.dispatchEvent(new Event("ka-country-change"));
      window.dispatchEvent(new Event("ka-date-change"));
      window.dispatchEvent(new Event("ka-demo-slot-change"));
      window.dispatchEvent(new Event("ka-workshop-slot-key-change"));
      window.dispatchEvent(new Event("ka-checkout-ready"));
    }

    setBookingMessage(`Workshop slot selected for ${slot.weekdayLabel}, ${slot.longDate}. Continue below to complete the Rs 99 payment.`);
    scrollToCheckout();

    if (scriptUrl) {
      const payload = {
        name: demoForm.name,
        contact: demoForm.contact,
        email: demoForm.email,
        age: "",
        country: "IN",
        date: slot.isoDate,
        timing: slot.time,
        program: "",
        lead_type: "workshop_group",
        source: "website_india_group_workshop",
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
        setBookingMessage("We saved your workshop slot details, but lead submission could not be confirmed. You can still continue to payment below.");
      });
    }
  };

  return (
    <section className="relative overflow-hidden px-4 pb-14 pt-8 md:px-6 md:pt-10" aria-labelledby="hero-heading">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_12%_18%,rgba(15,23,42,0.16),transparent_26%),radial-gradient(circle_at_78%_12%,rgba(251,191,36,0.26),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.45),transparent_80%)]" />
      <div className="mx-auto max-w-6xl">
        <div className="grid items-start gap-10 lg:grid-cols-[1.02fr_0.98fr]">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center rounded-full bg-white/80 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.22em] text-slate-700 shadow-sm ring-1 ring-slate-200/80 backdrop-blur">
                AI Demo + Study Skills
              </span>
              <span className="inline-flex animate-verticalBounce items-center rounded-full bg-amber-100 px-4 py-1.5 text-sm font-semibold text-slate-800 shadow-sm ring-1 ring-amber-200">
                Limited seats this weekend
              </span>
            </div>

            <p className="mt-6 max-w-lg text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Live AI learning for students ages 11-18
            </p>

            <h1 id="hero-heading" className="mt-3 max-w-3xl text-4xl font-extrabold leading-[0.98] tracking-[-0.04em] text-slate-950 md:text-6xl">
              Help your child use AI the right way for school, projects, and future-ready skills.
            </h1>

            <p className="mt-5 max-w-xl text-base leading-relaxed text-slate-700 md:text-lg">
              <span className="font-semibold text-slate-900">Kraft Academy</span> helps students move beyond random AI use and learn practical workflows for revision, productivity, projects, and confident academic application.
            </p>
            <p className="mt-3 max-w-xl text-sm font-medium text-slate-600 md:text-base">
              Start with a live workshop for a quick win, or move straight into the structured program for deeper skill-building.
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <a
                href="#india-demo-classes"
                onClick={() => {
                  if (typeof window !== "undefined") {
                    window.dispatchEvent(new Event("ka-demo-focus"));
                  }
                }}
                className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-slate-900/20 transition hover:-translate-y-0.5 hover:bg-slate-800"
              >
                Reserve Rs 99 Workshop Seat
              </a>
              <a
                href="#workshop-form"
                className="inline-flex items-center justify-center rounded-2xl border border-slate-300 bg-white/90 px-5 py-3 text-sm font-bold text-slate-900 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-400 hover:bg-white"
              >
                Book 1:1 or Global Demo
              </a>
            </div>

            <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold text-slate-700">
              <span className="rounded-full bg-white/85 px-3 py-1 shadow-sm ring-1 ring-slate-200">Beginner-friendly</span>
              <span className="rounded-full bg-white/85 px-3 py-1 shadow-sm ring-1 ring-slate-200">English / Hindi</span>
              <span className="rounded-full bg-white/85 px-3 py-1 shadow-sm ring-1 ring-slate-200">Email confirmation after payment</span>
              <span className="rounded-full bg-white/85 px-3 py-1 shadow-sm ring-1 ring-slate-200">Small live batches</span>
            </div>

            <div className="mt-7 grid max-w-2xl gap-3 sm:grid-cols-3">
              <div className="editorial-panel rounded-[1.35rem] px-4 py-4">
                <p className="text-2xl font-extrabold tracking-[-0.04em] text-slate-950">11-18</p>
                <p className="mt-1 text-xs font-medium uppercase tracking-[0.16em] text-slate-500">Age group</p>
              </div>
              <div className="editorial-panel rounded-[1.35rem] px-4 py-4">
                <p className="text-2xl font-extrabold tracking-[-0.04em] text-slate-950">Fri-Sun</p>
                <p className="mt-1 text-xs font-medium uppercase tracking-[0.16em] text-slate-500">Workshop days</p>
              </div>
              <div className="editorial-panel rounded-[1.35rem] px-4 py-4">
                <p className="text-2xl font-extrabold tracking-[-0.04em] text-slate-950">Rs 99</p>
                <p className="mt-1 text-xs font-medium uppercase tracking-[0.16em] text-slate-500">Group workshop price</p>
              </div>
            </div>
          </div>

          <aside className="relative overflow-hidden rounded-[2rem] border border-slate-200 bg-[linear-gradient(180deg,#0f172a_0%,#172554_62%,#ffffff_62%,#ffffff_100%)] p-5 shadow-[0_24px_70px_rgba(15,23,42,0.12)] lg:mt-2">
            <div className="pointer-events-none absolute -right-10 -top-8 h-28 w-28 rounded-full bg-amber-300/30 blur-2xl" aria-hidden="true" />
            <div className="pointer-events-none absolute right-6 top-24 h-16 w-16 rounded-full border border-white/15" aria-hidden="true" />

            <div className="relative">
              <span className="inline-flex rounded-full bg-white/12 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-white ring-1 ring-white/15">
                AI Future Skills
              </span>
              <p className="mt-4 text-2xl font-extrabold tracking-[-0.04em] text-white md:text-[2rem]">
                Structured AI program for students who are ready to go deeper
              </p>
              <p className="mt-3 text-sm leading-relaxed text-slate-200">
                Move beyond a one-time workshop into guided AI foundations, productivity workflows, and project-based application students can use in school and beyond.
              </p>
              <p className="mt-2 text-xs font-semibold uppercase tracking-[0.18em] text-amber-300">
                Best for families looking beyond a single workshop
              </p>

              <div className="mt-5 grid grid-cols-3 gap-2">
                <div className="rounded-2xl bg-white/10 px-3 py-3 text-white ring-1 ring-white/10">
                  <p className="text-lg font-extrabold tracking-[-0.04em]">4</p>
                  <p className="mt-1 text-[10px] uppercase tracking-[0.16em] text-slate-200">Weeks</p>
                </div>
                <div className="rounded-2xl bg-white/10 px-3 py-3 text-white ring-1 ring-white/10">
                  <p className="text-lg font-extrabold tracking-[-0.04em]">Live</p>
                  <p className="mt-1 text-[10px] uppercase tracking-[0.16em] text-slate-200">Guided sessions</p>
                </div>
                <div className="rounded-2xl bg-white/10 px-3 py-3 text-white ring-1 ring-white/10">
                  <p className="text-lg font-extrabold tracking-[-0.04em]">11-18</p>
                  <p className="mt-1 text-[10px] uppercase tracking-[0.16em] text-slate-200">Age band</p>
                </div>
              </div>
            </div>

            <div className="relative mt-6 rounded-[1.6rem] border border-slate-200 bg-white/95 p-4 shadow-sm">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">What students get</p>
              <ul className="mt-3 space-y-2 text-sm font-medium text-slate-800">
                <li>AI foundations and prompt thinking</li>
                <li>Productivity tools for school work</li>
                <li>Live projects and guided practice</li>
                <li>Weekend-friendly enrollment flow</li>
              </ul>

              <button
                type="button"
                onClick={scrollToProgramRegistration}
                className="mt-5 inline-flex w-full items-center justify-center rounded-2xl bg-amber-400 px-4 py-3 text-sm font-extrabold text-slate-900 shadow-lg shadow-amber-300/30 transition hover:-translate-y-0.5 hover:bg-amber-300"
              >
                Register for AI Future Skills
              </button>
              <p className="mt-3 text-xs text-slate-500">
                This opens the program details section below, expands it smoothly, and preselects AI Future Skills automatically.
              </p>
            </div>

            <div className="mt-4 overflow-hidden rounded-[1.6rem] border border-slate-200 bg-white/90 shadow-sm">
              <div className="aspect-[16/10] w-full overflow-hidden bg-slate-100">
                <img src={kid} alt="Student learning coding on a laptop" className="h-full w-full object-cover" />
              </div>
              <div className="grid grid-cols-3 gap-3 p-3">
                <div className="rounded-[1.1rem] border border-slate-200/80 bg-white px-3 py-3">
                  <p className="text-base font-extrabold tracking-[-0.04em] text-slate-950">AI</p>
                  <p className="mt-1 text-[10px] uppercase tracking-[0.16em] text-slate-500">Prompt skills</p>
                </div>
                <div className="rounded-[1.1rem] border border-slate-200/80 bg-white px-3 py-3">
                  <p className="text-base font-extrabold tracking-[-0.04em] text-slate-950">Live</p>
                  <p className="mt-1 text-[10px] uppercase tracking-[0.16em] text-slate-500">Interactive sessions</p>
                </div>
                <div className="rounded-[1.1rem] border border-slate-200/80 bg-white px-3 py-3">
                  <p className="text-base font-extrabold tracking-[-0.04em] text-slate-950">Smart</p>
                  <p className="mt-1 text-[10px] uppercase tracking-[0.16em] text-slate-500">Study systems</p>
                </div>
              </div>
            </div>
          </aside>
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
                India Group Workshops
              </span>
              <span className="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                Friday, Saturday, Sunday
              </span>
            </div>
            <span className="inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-slate-900">
              15 seats per slot
            </span>
          </div>

          <p className="mt-4 max-w-2xl text-sm font-semibold leading-relaxed text-slate-900 md:text-base">
            Pick one of the live India workshop slots below and continue straight to the Rs 99 checkout.
          </p>
          <p className="mt-2 text-xs font-medium text-slate-600">Enter name, email, and a valid Indian contact number to unlock these workshop slots. This is the fastest way to get your child into a live session.</p>
          <div className="mt-3 grid gap-2 text-xs font-medium text-slate-700 sm:grid-cols-3">
            <div className="rounded-2xl border border-amber-200 bg-white/80 px-3 py-2">1. Choose a live workshop slot</div>
            <div className="rounded-2xl border border-amber-200 bg-white/80 px-3 py-2">2. Complete payment via Razorpay or PayPal</div>
            <div className="rounded-2xl border border-amber-200 bg-white/80 px-3 py-2">3. Get confirmation and session link by email</div>
          </div>

          <div className="mt-5 grid gap-3 xl:grid-cols-3">
            <input
              type="text"
              value={demoForm.name}
              onChange={(event) => {
                setDemoForm((prev) => ({ ...prev, name: event.target.value }));
                if (typeof window !== "undefined") {
                  window.dispatchEvent(new Event("ka-booking-input-change"));
                }
              }}
              placeholder="Student name"
              aria-label="Workshop booking name"
              className="h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-900 outline-none ring-offset-2 transition focus:border-amber-500 focus:ring-2 focus:ring-amber-500"
            />
            <input
              type="email"
              value={demoForm.email}
              onChange={(event) => {
                setDemoForm((prev) => ({ ...prev, email: event.target.value }));
                if (typeof window !== "undefined") {
                  window.dispatchEvent(new Event("ka-booking-input-change"));
                }
              }}
              placeholder="Parent email"
              aria-label="Workshop booking email"
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
                onChange={(value) => {
                  setDemoForm((prev) => ({ ...prev, contact: value || "" }));
                  if (typeof window !== "undefined") {
                    window.dispatchEvent(new Event("ka-contact-change"));
                    window.dispatchEvent(new Event("ka-booking-input-change"));
                  }
                }}
                className="phone-input bg-white"
                aria-label="Indian contact number"
              />
            </div>
          </div>

          {touched && !isIndianContact && (
            <p className="mt-2 text-sm font-medium text-rose-700">Please enter a valid Indian contact number for workshop booking.</p>
          )}

          <div className="mt-6 space-y-4">
            {workshopDays.length === 0 && (
              <div className="rounded-[1.4rem] border border-slate-200 bg-slate-50 px-4 py-4 text-sm font-medium text-slate-700">
                No group workshop slots are available right now. Please use the preferred timing section below for a 1:1 or global booking.
              </div>
            )}
            {workshopDays.map((day) => (
              <div key={day.isoDate} className="rounded-[1.6rem] border border-amber-200 bg-[linear-gradient(180deg,#fffef8_0%,#fff8de_100%)] p-4 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">{day.weekdayLabel}</p>
                    <p className="mt-1 text-lg font-extrabold tracking-[-0.03em] text-slate-950">{day.longDate}</p>
                  </div>
                  <span className="inline-flex rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm">
                    Group workshop · Rs 99
                  </span>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  {day.slots.map((slot) => {
                    const seatsLeft = Number(seatMap[slot.slotKey] ?? 15);
                    const isDisabled = slot.isClosedForTime || seatsLeft <= 0;
                    return (
                      <button
                        key={slot.slotKey}
                        type="button"
                        onClick={() => handleDemoSlotClick(slot)}
                        disabled={isDisabled}
                        className={`group rounded-[1.3rem] border px-4 py-4 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 ${
                          isDisabled
                            ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400"
                            : "border-amber-200 bg-white shadow-sm hover:-translate-y-0.5 hover:border-amber-300 hover:shadow-[0_20px_40px_rgba(251,191,36,0.12)]"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-base font-bold text-slate-950">{slot.time}</p>
                          <span className="inline-flex rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-900">
                            {isDisabled ? (slot.isClosedForTime ? "Closed" : "Full") : `${seatsLeft} seats left`}
                          </span>
                        </div>
                        <p className="mt-2 text-xs font-medium text-slate-600 group-hover:text-slate-800">
                          {isDisabled
                            ? slot.isClosedForTime
                              ? "This workshop slot has already started or closed."
                              : "This workshop slot has reached the 15-seat limit."
                            : "Tap to continue to checkout for this workshop slot."}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {bookingMessage && (
            <p className="mt-4 text-sm font-medium text-slate-700" role="status" aria-live="polite">
              {bookingMessage}
            </p>
          )}
        </div>

        <div className="mt-5 flex flex-col gap-3 text-sm text-slate-700">
          <p>
            Want your preferred timing for demo classes 1:1?{" "}
            <a href="#workshop-form" className="font-semibold text-slate-900 underline decoration-amber-400 underline-offset-4">
              This is available in the booking section below.
            </a>
          </p>
          <a
            href="#workshop-form"
            className="inline-flex w-fit items-center gap-2 rounded-full bg-slate-900 px-3 py-1.5 font-semibold text-white shadow-sm shadow-slate-300/40 transition hover:bg-slate-800"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
              <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2Zm6.93 9h-3.27a15.72 15.72 0 0 0-1.18-4.57A8.05 8.05 0 0 1 18.93 11ZM12 4.07c.88 1.09 1.89 3.43 2.27 6.93H9.73C10.11 7.5 11.12 5.16 12 4.07ZM4.48 13h3.28A15.72 15.72 0 0 0 8.93 17.57 8.05 8.05 0 0 1 4.48 13Zm3.28-2H4.48a8.05 8.05 0 0 1 4.45-4.57A15.72 15.72 0 0 0 7.76 11Zm1.97 0a13.79 13.79 0 0 1 2.27-6.53A13.79 13.79 0 0 1 14.27 11Zm4.54 2A13.79 13.79 0 0 1 12 19.53 13.79 13.79 0 0 1 9.73 13Zm1.39 4.57A15.72 15.72 0 0 0 16.24 13h3.28a8.05 8.05 0 0 1-4.45 4.57Z" />
            </svg>
            Global students or 1:1 demo? Book your preferred timing here.
          </a>
          <p className="text-xs text-slate-500">
            Parents usually use the group workshop for a fast first session, and the 1:1 / global route when they want a custom timing.
          </p>
        </div>
      </div>
    </section>
  );
}

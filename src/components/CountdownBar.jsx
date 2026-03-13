import { useEffect, useState } from "react";

const IST_TIME_ZONE = "Asia/Kolkata";

function getIstNowParts() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: IST_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(new Date());

  const lookup = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return {
    year: Number(lookup.year),
    month: Number(lookup.month),
    day: Number(lookup.day),
    hour: Number(lookup.hour),
    minute: Number(lookup.minute),
    second: Number(lookup.second),
    isoDate: `${lookup.year}-${lookup.month}-${lookup.day}`,
  };
}

function getSecondsUntilIstMidnight() {
  const { hour, minute, second } = getIstNowParts();
  return Math.max(0, 24 * 3600 - (hour * 3600 + minute * 60 + second));
}

function formatTime(totalSeconds) {
  const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, "0");
  const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, "0");
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  return `${hours}:${minutes}:${seconds}`;
}

function getStoredDate() {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem("ka_date") || "";
}

export default function CountdownBar() {
  const [secondsLeft, setSecondsLeft] = useState(getSecondsUntilIstMidnight);

  useEffect(() => {
    const updateTimer = () => {
      setSecondsLeft(getSecondsUntilIstMidnight());
    };

    updateTimer();

    const intervalId = window.setInterval(updateTimer, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-amber-200 bg-slate-900/95 px-4 py-3 text-white backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 md:flex-row md:justify-between">
        <p className="text-center text-sm font-semibold md:text-base">
          Booking window closes in {formatTime(secondsLeft)} based on IST.
        </p>
        <a
          href="#workshop-form"
          className="rounded-xl bg-amber-400 px-4 py-2 text-xs font-bold text-slate-900 transition hover:bg-amber-300 md:text-sm"
        >
          Reserve seats for your child
        </a>
      </div>
    </div>
  );
}

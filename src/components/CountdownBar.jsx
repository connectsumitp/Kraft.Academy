import { useEffect, useState } from "react";

const TOTAL_SECONDS = 8 * 60 * 60;

function formatTime(total) {
  const hours = String(Math.floor(total / 3600)).padStart(2, "0");
  const minutes = String(Math.floor((total % 3600) / 60)).padStart(2, "0");
  const seconds = String(total % 60).padStart(2, "0");
  return `${hours}:${minutes}:${seconds}`;
}

export default function CountdownBar() {
  const [secondsLeft, setSecondsLeft] = useState(TOTAL_SECONDS);

  useEffect(() => {
    const id = window.setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-amber-200 bg-slate-900/95 px-4 py-3 text-white backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-2 md:flex-row md:justify-between">
        <p className="text-sm font-semibold md:text-base">Workshop Seats Closing Soon: {formatTime(secondsLeft)}</p>
        <a
          href="#workshop-form"
          className="rounded-xl bg-amber-400 px-4 py-2 text-xs font-bold text-slate-900 transition hover:bg-amber-300 md:absolute md:left-1/2 md:-translate-x-1/2 md:text-sm"
        >
          Reserve seats for your child
        </a>
      </div>
    </div>
  );
}

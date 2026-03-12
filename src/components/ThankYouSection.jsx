import { useEffect, useState } from "react";

export default function ThankYouSection() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const updateVisibility = () => {
      const hasHash = window.location.hash === "#thank-you";
      const hasPayment = Boolean(window.localStorage.getItem("ka_last_payment"));
      setVisible(hasHash || hasPayment);
    };

    updateVisibility();
    window.addEventListener("hashchange", updateVisibility);

    return () => {
      window.removeEventListener("hashchange", updateVisibility);
    };
  }, []);

  if (!visible) return null;

  return (
    <section id="thank-you" className="px-4 pb-16 pt-8 md:px-6" aria-labelledby="thank-you-title">
      <div className="mx-auto max-w-5xl rounded-2xl border border-emerald-200 bg-white p-6 shadow-sm md:p-8">
        <h2 id="thank-you-title" className="text-2xl font-bold text-emerald-700 md:text-3xl">
          Thank You! Your seat has been reserved.
        </h2>
        <p className="mt-2 text-sm text-slate-700">
          Your email will receive the date, time, and link for the session soon. Please add that to your calendar.
        </p>
      </div>
    </section>
  );
}

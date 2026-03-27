import { useEffect, useState } from "react";

export default function ThankYouSection() {
  const [visible, setVisible] = useState(false);
  const [paymentType, setPaymentType] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;

    const updateVisibility = () => {
      const lastPayment = window.sessionStorage.getItem("ka_last_payment") || "";
      const hasPayment = Boolean(lastPayment);
      setPaymentType(lastPayment);
      setVisible(hasPayment);
    };

    updateVisibility();
    window.addEventListener("hashchange", updateVisibility);

    return () => {
      window.removeEventListener("hashchange", updateVisibility);
    };
  }, []);

  useEffect(() => {
    if (!visible || typeof window === "undefined") return;

    const scrollToThankYou = () => {
      const section = document.getElementById("thank-you");
      if (section) {
        section.scrollIntoView({ behavior: "smooth", block: "start" });
      }
      if (window.location.hash === "#thank-you") {
        window.history.replaceState(null, "", window.location.pathname + window.location.search);
      }
    };

    const timer = window.setTimeout(scrollToThankYou, 100);
    return () => window.clearTimeout(timer);
  }, [visible]);

  useEffect(() => {
    if (!visible || typeof window === "undefined") return;

    const timer = window.setTimeout(() => {
      window.sessionStorage.removeItem("ka_last_payment");
    }, 500);

    return () => window.clearTimeout(timer);
  }, [visible]);

  if (!visible) return null;

  const isProgram = paymentType === "program";

  return (
    <section id="thank-you" className="reveal-on-scroll scroll-mt-28 px-4 pb-24 pt-8 md:px-6 md:pb-16" aria-labelledby="thank-you-title">
      <div className="editorial-panel mx-auto max-w-5xl rounded-[2rem] border-emerald-200 p-6 md:p-8">
        <span className="section-kicker bg-emerald-100 text-emerald-800">Booking confirmed</span>
        <h2 id="thank-you-title" className="text-2xl font-bold text-emerald-700 md:text-3xl">
          {isProgram ? "Thank you for registering in our program." : "Thank You! Your seat has been reserved."}
        </h2>
        <p className="mt-2 text-sm text-slate-700">
          {isProgram
            ? "We will reach to you with the batch dates. In case of enquiries, hit the WhatsApp or Mail icons."
            : "Your email will receive the date, time, and link for the session soon. Please add that to your calendar."}
        </p>
      </div>
    </section>
  );
}

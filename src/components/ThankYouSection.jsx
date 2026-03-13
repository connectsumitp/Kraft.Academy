import { useEffect, useState } from "react";

export default function ThankYouSection() {
  const [visible, setVisible] = useState(false);
  const [paymentType, setPaymentType] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;

    const updateVisibility = () => {
      const hasHash = window.location.hash === "#thank-you";
      const lastPayment = window.localStorage.getItem("ka_last_payment") || "";
      const hasPayment = Boolean(lastPayment);
      setPaymentType(lastPayment);
      setVisible(hasHash || hasPayment);
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
    };

    const timer = window.setTimeout(scrollToThankYou, 100);
    return () => window.clearTimeout(timer);
  }, [visible]);

  if (!visible) return null;

  const isProgram = paymentType === "program";

  return (
    <section id="thank-you" className="px-4 pb-16 pt-8 md:px-6" aria-labelledby="thank-you-title">
      <div className="mx-auto max-w-5xl rounded-2xl border border-emerald-200 bg-white p-6 shadow-sm md:p-8">
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

import { useEffect } from "react";
import Header from "./components/Header.jsx";
import Hero from "./components/Hero.jsx";
import ProgramCard from "./components/ProgramCard.jsx";
import LeadForm from "./components/LeadForm.jsx";
import WorkshopLeadForm from "./components/WorkshopLeadForm.jsx";
import CountdownBar from "./components/CountdownBar.jsx";
import BrandName from "./components/BrandName.jsx";
import PricingSection from "./components/PricingSection.jsx";
import ThankYouSection from "./components/ThankYouSection.jsx";

const programData = [
  {
    title: "AI Future Skills",
    details: "Ages 11-18 | 4 Weeks",
    features: ["AI Fundamentals", "Productivity Tools", "AI for Exams", "Live Projects"],
  },
  {
    title: "Coding Bootcamp",
    details: "Ages 11-18 | 2 Months",
    features: ["Coding Fundamentals", "Logical Thinking", "Mini Projects", "Competitive Mindset"],
  },
];

const trustItems = [
  "Small Batches (15 Students)",
  "Personalized Training",
  "Real Projects",
  "Certificate",
];

const faqs = [
  {
    q: "Who can join this workshop?",
    a: "Students ages 11 to 18 can join.",
  },
  {
    q: "Any prerequisites needed?",
    a: "No prior coding or AI experience is required. This workshop is beginner friendly.",
  },
  {
    q: "Will recording be shared?",
    a: "Course content will be shared.",
  },
  {
    q: "What is the workshop language?",
    a: "The workshop is conducted in English/Hindi.",
  },
  {
    q: "What will I gain from the AI session?",
    a: "Students will learn practical AI study techniques, prompt skills, and productivity tools for real academic use.",
  },
  {
    q: "Will this help me in academics?",
    a: "Yes. The workshop focuses on better revision, structured note making, and smart exam preparation using AI tools.",
  },
];

export default function App() {
  useEffect(() => {
    let rafId = null;
    let x = 0;
    let y = 0;

    const flush = () => {
      document.documentElement.style.setProperty("--cursor-x", `${x}px`);
      document.documentElement.style.setProperty("--cursor-y", `${y}px`);
      rafId = null;
    };

    const onMove = (event) => {
      x = event.clientX;
      y = event.clientY;
      if (rafId === null) {
        rafId = window.requestAnimationFrame(flush);
      }
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    return () => {
      window.removeEventListener("mousemove", onMove);
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId);
      }
    };
  }, []);

  return (
    <div id="top" className="min-h-screen bg-brand-50 pb-32 text-slate-900 md:pb-28">
      <Header />
      <main>
        <Hero />
        <WorkshopLeadForm />

        <section id="programs" className="px-4 py-10 md:px-6" aria-labelledby="programs-title">
          <div className="mx-auto max-w-6xl">
            <h2 id="programs-title" className="text-2xl font-bold text-slate-900 md:text-3xl">
              Our Programs
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-slate-700 md:text-base">
              Designed for Ages 11-18 with outcome-focused sessions and real-world application.
            </p>

            <div className="mt-6 grid gap-6 md:grid-cols-2">
              {programData.map((program) => (
                <ProgramCard key={program.title} {...program} />
              ))}
            </div>
          </div>
        </section>

        <section className="px-4 py-4 md:px-6" aria-label="Trust highlights">
          <div className="mx-auto max-w-6xl rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <ul className="grid gap-3 text-sm font-medium text-slate-800 sm:grid-cols-2 lg:grid-cols-4">
              {trustItems.map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <span aria-hidden="true" className="text-emerald-600">
                    ✔
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <LeadForm />

        <PricingSection />

        <ThankYouSection />

        <section id="faqs" className="px-4 pb-16 pt-2 md:px-6" aria-labelledby="faq-title">
          <div className="mx-auto max-w-5xl">
            <h2 id="faq-title" className="text-2xl font-bold text-slate-900 md:text-3xl">
              FAQs
            </h2>
            <div className="mt-5 space-y-4">
              {faqs.map((faq) => (
                <details key={faq.q} className="overflow-hidden rounded-2xl border border-slate-200 bg-[#F3F4F6]">
                  <summary className="cursor-pointer list-none border-b border-slate-200 px-6 py-5 text-lg font-semibold text-slate-900 md:text-xl">
                    {faq.q}
                  </summary>
                  <p className="px-6 py-6 text-base leading-relaxed text-slate-800 md:text-lg">{faq.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="px-4 pb-16 md:px-6" aria-label="Instructor credentials">
          <div className="mx-auto max-w-5xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-6 md:flex-row md:items-center">
              <div className="mx-auto w-full max-w-[220px] overflow-hidden rounded-[1.5rem] border border-slate-200 bg-slate-50 shadow-sm md:mx-0 md:max-w-[240px]">
                <div className="aspect-[4/5] w-full">
                  <img
                    src="/images/instructor-photo.png"
                    alt="Instructor Sumit Pandey"
                    className="h-full w-full object-cover object-top"
                  />
                </div>
              </div>

              <div className="min-w-0 flex-1">
                <h3 className="text-xl font-bold text-slate-900">Instructor Credentials</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-700">
                  Sumit Pandey. Product Manager. 5 Years of Industrial Experience. AI Instructor.
                </p>
                <p className="mt-3 text-sm text-slate-600">
                  Students learn from an instructor with hands-on product and AI experience, with a focus on practical
                  learning, real-world tools, and clear guidance for academic growth.
                </p>
                <a
                  href="https://linkedin.com/in/sumitpandey1996"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-slate-800 hover:underline"
                >
                  <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden="true">
                    <path d="M19 3A2 2 0 0 1 21 5V19A2 2 0 0 1 19 21H5A2 2 0 0 1 3 19V5A2 2 0 0 1 5 3H19M8.34 17V10.97H6.33V17H8.34M7.34 10.12A1.17 1.17 0 1 0 7.34 7.78A1.17 1.17 0 0 0 7.34 10.12M17.67 17V13.35C17.67 11.4 16.63 10.49 15.24 10.49C14.11 10.49 13.6 11.11 13.32 11.55V10.97H11.31V17H13.32V13.64C13.32 12.75 13.49 11.9 14.6 11.9C15.69 11.9 15.7 12.91 15.7 13.7V17H17.67Z" />
                  </svg>
                  linkedin.com/in/sumitpandey1996
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white px-4 py-6 md:px-6">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 text-sm text-slate-700">
          <p className="text-base font-semibold text-slate-900">
            <BrandName textClassName="leading-none" />
          </p>
          <a href="tel:+919958950167" className="font-medium text-slate-800 hover:underline">
            Contact: +91 99589 50167
          </a>
        </div>
      </footer>

      <div className="floating-contact-stack flex flex-col items-center gap-2">
        <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white shadow-lg">Connect</span>
        <a
          href="https://wa.me/919958950167"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Chat with Kraft Academy on WhatsApp"
          className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#25D366] text-white shadow-xl shadow-green-700/30 transition hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2 md:h-14 md:w-14"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true" className="h-6 w-6 fill-current md:h-7 md:w-7">
            <path d="M20.52 3.48A11.86 11.86 0 0 0 12.07 0C5.5 0 .17 5.34.17 11.9c0 2.1.55 4.16 1.6 5.98L0 24l6.31-1.66a11.87 11.87 0 0 0 5.76 1.47h.01c6.56 0 11.9-5.34 11.9-11.9 0-3.18-1.24-6.17-3.46-8.43Zm-8.45 18.3h-.01a9.9 9.9 0 0 1-5.04-1.38l-.36-.21-3.75.99 1-3.65-.23-.37a9.9 9.9 0 0 1-1.52-5.27c0-5.46 4.45-9.91 9.92-9.91a9.87 9.87 0 0 1 7.02 2.91 9.86 9.86 0 0 1 2.9 7.01c0 5.47-4.44 9.92-9.91 9.92Zm5.44-7.4c-.3-.15-1.78-.88-2.05-.99-.28-.1-.48-.15-.68.15-.2.3-.78.99-.95 1.2-.18.2-.35.23-.65.08-.3-.15-1.25-.46-2.38-1.47a8.9 8.9 0 0 1-1.65-2.05c-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.53.15-.18.20-.3.3-.5.1-.2.05-.38-.03-.53-.08-.15-.68-1.64-.93-2.24-.25-.6-.5-.52-.68-.53h-.58c-.2 0-.53.08-.8.38-.28.3-1.05 1.03-1.05 2.5 0 1.48 1.08 2.9 1.23 3.1.15.2 2.12 3.24 5.14 4.54.72.31 1.28.5 1.72.65.72.23 1.37.2 1.88.12.57-.08 1.78-.73 2.03-1.43.25-.7.25-1.3.17-1.43-.07-.12-.27-.2-.57-.35Z" />
          </svg>
        </a>
        <a
          href="mailto:connect.sumitp@gmail.com"
          aria-label="Email Kraft Academy"
          className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#EA4335] text-white shadow-xl shadow-red-700/30 transition hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 md:h-14 md:w-14"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true" className="h-6 w-6 fill-current md:h-7 md:w-7">
            <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2Zm0 4.2-8 5-8-5V6l8 5 8-5v2.2Z" />
          </svg>
        </a>
      </div>

      <CountdownBar />
    </div>
  );
}

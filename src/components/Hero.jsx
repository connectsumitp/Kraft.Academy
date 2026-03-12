import BrandName from "./BrandName.jsx";
import kid from "../assets/kid.png";

export default function Hero() {
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

          <div className="mt-8 flex flex-wrap gap-4">
            <a
              href="#workshop-form"
              className="animate-pulseSoft rounded-2xl bg-amber-400 px-6 py-3 text-sm font-bold text-slate-900 shadow-lg shadow-amber-700/20 transition hover:bg-amber-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2"
            >
              Reserve seats for your child
            </a>
            <a
              href="#registration"
              className="rounded-2xl border-2 border-slate-800 bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-800 focus-visible:ring-offset-2"
            >
              Register in Programs
            </a>
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

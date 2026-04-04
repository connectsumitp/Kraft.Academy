export default function ProgramCard({ title, details, features }) {
  const handleProgramClick = (event) => {
    if (typeof window === "undefined") return;
    event.preventDefault();
    window.location.hash = "#registration";
    window.dispatchEvent(new CustomEvent("ka-program-focus", { detail: { program: title } }));
  };

  return (
    <article className="editorial-panel reveal-on-scroll rounded-[2rem] p-6">
      <span className="section-kicker !mb-0">Signature track</span>
      <h3 className="mt-3 text-xl font-bold text-slate-900">{title}</h3>
      <p className="mt-2 text-sm font-medium text-slate-700">{details}</p>
      <ul className="mt-4 space-y-2">
        {features.map((feature) => (
          <li key={feature} className="flex items-start gap-2 text-sm text-slate-700">
            <span className="mt-1 inline-flex h-2 w-2 rounded-full bg-amber-400" aria-hidden="true" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>
      <a
        href="#registration"
        onClick={handleProgramClick}
        className="mt-6 inline-flex rounded-xl bg-amber-400 px-4 py-2 text-sm font-bold text-slate-900 transition hover:bg-amber-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2"
      >
        Register in Program
      </a>
    </article>
  );
}

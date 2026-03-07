import logo from "../assets/logo.png";

export default function BrandName({ className = "", textClassName = "", logoClassName = "" }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`.trim()}>
      <img
        src={logo}
        alt="Kraft Academy logo"
        className={`h-[1.55em] w-[1.55em] object-contain ${logoClassName}`.trim()}
      />
      <span className={textClassName}>Kraft Academy</span>
    </span>
  );
}

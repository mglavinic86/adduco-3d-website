export function Arrow({ diagonal = false }: { diagonal?: boolean }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d={diagonal ? "M6 18 18 6M6 6h12v12" : "M4 12h15m-6-6 6 6-6 6"}
        stroke="currentColor"
        strokeWidth="1.3"
      />
    </svg>
  );
}
export function Wordmark() {
  return (
    <span className="brand-art">
      <img
        src="/assets/adduco-logo-dark.webp"
        alt="Adduco"
        width="1008"
        height="209"
      />
    </span>
  );
}

interface LogoProps {
  size?: number;
  className?: string;
}

export default function Logo({ size = 32, className = "" }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="DMS Logo"
    >
      {/* Rounded square background */}
      <rect width="40" height="40" rx="10" fill="var(--dms-primary)" />

      {/* Stylized "D" letterform */}
      <path
        d="M13 10h7c5.523 0 10 4.477 10 10s-4.477 10-10 10h-7V10z"
        fill="none"
        stroke="#09090b"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <line
        x1="13"
        y1="20"
        x2="22"
        y2="20"
        stroke="#09090b"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

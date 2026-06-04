export function JokoLogo({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M4 8L16 16L4 24V8Z"
        fill="currentColor"
      />
      <path
        d="M28 8L16 16L28 24V8Z"
        fill="currentColor"
      />
    </svg>
  );
}

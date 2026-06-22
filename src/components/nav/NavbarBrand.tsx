import Link from "next/link";

const BRAND_LETTERS = ["e", "c", "h", "o", "s", "p", "e", "a", "k"] as const;
const SPEAK_START_INDEX = 4;

export function NavbarBrand() {
  return (
    <Link
      href="/"
      aria-label="Echo Speak"
      className="flex items-center justify-center gap-px"
    >
      {BRAND_LETTERS.map((letter, index) => (
        <span key={`${letter}-${index}`} className="flex items-center">
          {index === SPEAK_START_INDEX && (
            <span aria-hidden="true" className="w-1.5 shrink-0" />
          )}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/nav/brand-letter-${letter}.png`}
            alt=""
            className="h-6 w-auto object-contain opacity-90"
          />
        </span>
      ))}
    </Link>
  );
}

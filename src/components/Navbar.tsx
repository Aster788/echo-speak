import Link from "next/link";

const links = [
  { href: "/", label: "Home" },
  { href: "/import", label: "Import" },
  { href: "/library", label: "Library" },
  { href: "/review", label: "Review" },
  { href: "/gaps", label: "Gaps" },
  { href: "/settings", label: "Settings" },
];

export function Navbar() {
  return (
    <nav className="border-b px-4 py-3">
      <div className="mx-auto flex max-w-4xl items-center gap-6">
        <Link href="/" className="font-bold">
          Echo Speak
        </Link>
        <ul className="flex gap-4 text-sm">
          {links.slice(1).map((link) => (
            <li key={link.href}>
              <Link href={link.href} className="hover:underline">
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}

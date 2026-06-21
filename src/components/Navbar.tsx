"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/import", label: "Import" },
  { href: "/topics", label: "Topics" },
  { href: "/library", label: "Library" },
  { href: "/review", label: "Review" },
  { href: "/gaps", label: "Gaps" },
  { href: "/settings", label: "Settings" },
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="shrink-0 border-b border-[#222222]/10 px-4 py-3">
      <div className="flex items-center gap-3">
        <Link
          href="/"
          className="shrink-0 text-[0.8125rem] font-bold text-[#000000]"
        >
          Echo Speak
        </Link>
        <ul className="flex flex-1 gap-3 overflow-x-auto text-[0.75rem] font-medium text-[#222222] [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {links.map((link) => {
            const active = pathname === link.href;
            return (
              <li key={link.href} className="shrink-0">
                <Link
                  href={link.href}
                  className={`whitespace-nowrap transition-opacity duration-150 ${
                    active
                      ? "font-medium text-[#000000] underline underline-offset-4"
                      : "text-[#222222] opacity-80 hover:opacity-100"
                  }`}
                >
                  {link.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}

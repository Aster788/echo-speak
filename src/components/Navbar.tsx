"use client";

import { NavbarBrand } from "@/components/nav/NavbarBrand";
import { NavSignLink } from "@/components/nav/NavSignLink";
import { useReviewReset } from "@/components/review/ReviewResetContext";
import { usePathname } from "next/navigation";

const links = [
  { href: "/import", label: "Import" },
  { href: "/collections", label: "Collections" },
  { href: "/review", label: "Review" },
  { href: "/gaps", label: "Gaps" },
  { href: "/settings", label: "Settings" },
] as const;

export function Navbar() {
  const pathname = usePathname();
  const reviewReset = useReviewReset();

  return (
    <nav className="shrink-0 border-b border-[#222222]/10 px-3 py-2">
      <div className="flex flex-col gap-2">
        <NavbarBrand />
        <ul className="flex w-full min-w-0 list-none items-center p-0">
          {links.map((link, index) => (
            <li key={link.href} className="contents">
              {index > 0 && (
                <span
                  aria-hidden="true"
                  className="shrink-0 text-[11px] text-[#222222]/35"
                >
                  ｜
                </span>
              )}
              <span className="flex min-w-0 flex-1 justify-center">
                <NavSignLink
                  href={link.href}
                  label={link.label}
                  active={pathname === link.href}
                  onActiveClick={
                    link.href === "/review"
                      ? (event) => {
                          event.preventDefault();
                          reviewReset?.resetReviewHome();
                        }
                      : undefined
                  }
                />
              </span>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}

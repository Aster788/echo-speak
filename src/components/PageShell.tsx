"use client";

import type { ReactNode } from "react";
import { Navbar } from "@/components/Navbar";

type PageShellProps = {
  children: ReactNode;
  mainClassName?: string;
};

const phoneFrameClassName = [
  "mx-auto flex w-full max-w-[430px] flex-col overflow-hidden bg-[#FFFFFF]",
  "rounded-[36px] border-[2.5px] border-[#D4D4D4] md:rounded-[40px]",
  "shadow-[0_10px_28px_rgba(34,34,34,0.08),0_2px_6px_rgba(34,34,34,0.05),inset_0_1px_0_rgba(255,255,255,0.95),inset_0_0_0_1px_rgba(34,34,34,0.04)]",
  "min-h-[calc(100vh-1.5rem)] md:min-h-[min(844px,calc(100vh-3rem))]",
].join(" ");

export function PageShell({ children, mainClassName = "" }: PageShellProps) {
  return (
    <div className="min-h-screen bg-[#222222]/[0.04] p-3 md:flex md:justify-center md:p-6">
      <div className={phoneFrameClassName}>
        <div
          className="hidden shrink-0 border-b border-[#222222]/10 py-2.5 md:block"
          aria-hidden="true"
        >
          <div className="mx-auto h-1 w-16 rounded-full bg-[#222222]/15" />
        </div>
        <Navbar />
        <main className={`flex-1 px-4 py-8 ${mainClassName}`}>{children}</main>
      </div>
    </div>
  );
}

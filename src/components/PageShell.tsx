"use client";

import type { ReactNode } from "react";
import { Navbar } from "@/components/Navbar";
import { ReviewResetProvider } from "@/components/review/ReviewResetContext";

type PageShellProps = {
  children: ReactNode;
  mainClassName?: string;
};

const phoneFrameClassName = [
  "mx-auto flex h-[calc(100dvh-1.5rem)] max-h-[932px] w-full max-w-[430px] flex-col overflow-hidden bg-[#FFFFFF]",
  "rounded-[36px] border-[2.5px] border-[#D4D4D4] md:rounded-[40px]",
  "shadow-[0_10px_28px_rgba(34,34,34,0.08),0_2px_6px_rgba(34,34,34,0.05),inset_0_1px_0_rgba(255,255,255,0.95),inset_0_0_0_1px_rgba(34,34,34,0.04)]",
  "md:h-[min(932px,calc(100vh-3rem))]",
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
        <ReviewResetProvider>
          <Navbar />
          <main
            className={`phone-scrollbar min-h-0 flex-1 overflow-y-auto px-4 pt-4 pb-8 ${mainClassName}`}
          >
            {children}
          </main>
        </ReviewResetProvider>
      </div>
    </div>
  );
}

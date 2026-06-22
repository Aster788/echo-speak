import type { ReactNode } from "react";
import {
  NOTEBOOK_DISPLAY_HEIGHT,
  notebookWritingArea,
} from "@/lib/import-notebook-layout";

type ImportNotebookShellProps = {
  children: ReactNode;
};

export function ImportNotebookShell({ children }: ImportNotebookShellProps) {
  return (
    <div
      className="relative mx-auto flex w-full shrink-0 flex-col"
      style={{ height: NOTEBOOK_DISPLAY_HEIGHT }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/import/notebook.png"
        alt=""
        className="pointer-events-none absolute inset-0 h-full w-full object-fill"
        aria-hidden="true"
      />
      <div
        className="absolute inset-0 z-10 flex flex-col justify-center"
        style={notebookWritingArea}
      >
        {children}
      </div>
    </div>
  );
}

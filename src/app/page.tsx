import Image from "next/image";
import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { PageShell } from "@/components/PageShell";

export default function HomePage() {
  return (
    <PageShell mainClassName="flex min-h-0 flex-1 flex-col">
      <PageHeader description="Turn video transcripts into expressions you actually remember." />
      <div className="mt-4 flex flex-col gap-3">
        <Link
          href="/import"
          className="rounded-[1rem] border-[2.5px] border-[#000000] bg-[#000000] px-4 py-2.5 text-center text-[0.8125rem] font-medium text-[#FFFFFF] transition-opacity duration-150 hover:opacity-90"
        >
          Import transcript
        </Link>
        <Link
          href="/review"
          className="rounded-[1rem] border-[2.5px] border-[#D4D4D4] px-4 py-2.5 text-center text-[0.8125rem] font-medium text-[#222222] transition-opacity duration-150 hover:opacity-80"
        >
          Start review
        </Link>
      </div>
      <div className="mt-4 flex min-h-0 flex-1 items-center justify-center pb-2">
        <Image
          src="/home/hello.png"
          alt=""
          width={390}
          height={501}
          className="h-auto w-full max-w-[390px] object-contain"
          priority
          aria-hidden
        />
      </div>
    </PageShell>
  );
}

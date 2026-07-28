import Image from "next/image";
import Link from "next/link";
import { after } from "next/server";
import { PageHeader } from "@/components/PageHeader";
import {
  getFeishuHomeStatus,
  runFeishuSyncForUserId,
} from "@/app/feishu/actions";
import { getTodaysReviewSummary } from "@/app/review/actions";

export default async function HomePage() {
  const [summary, feishuStatus] = await Promise.all([
    getTodaysReviewSummary(),
    getFeishuHomeStatus(),
  ]);

  // Capture userId outside after() — cookies() is not allowed inside after().
  const autoSyncUserId =
    feishuStatus.shouldAutoSync && feishuStatus.userId
      ? feishuStatus.userId
      : null;
  if (autoSyncUserId) {
    after(async () => {
      await runFeishuSyncForUserId(autoSyncUserId, "incremental");
    });
  }

  return (
    <>
      <PageHeader description="Turn video transcripts into expressions you actually remember." />
      <div className="mt-4 flex shrink-0 flex-col gap-3">
        {feishuStatus.line ? (
          <p className="text-center text-[0.6875rem] font-normal text-[#222222]/55">
            {feishuStatus.line}
          </p>
        ) : null}
        <Link
          href="/import"
          className="rounded-[1rem] border-[2.5px] border-[#000000] bg-[#000000] px-4 py-2.5 text-center text-[0.8125rem] font-medium text-[#FFFFFF] transition-opacity duration-150 hover:opacity-90"
        >
          Import transcript
        </Link>
        <Link
          href="/review?start=todays"
          className="rounded-[1rem] border-[2.5px] border-[#D4D4D4] px-4 py-2.5 text-center text-[0.8125rem] font-medium text-[#222222] transition-opacity duration-150 hover:opacity-80"
        >
          <span className="block">Start today&apos;s review</span>
          <span className="mt-0.5 block text-[0.75rem] font-normal opacity-70">
            {summary.displayLabel}
          </span>
        </Link>
      </div>
      <div className="mt-4 flex shrink-0 justify-center pb-2">
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
    </>
  );
}

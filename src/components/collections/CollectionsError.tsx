"use client";

type CollectionsErrorProps = {
  message: string;
};

export function CollectionsError({ message }: CollectionsErrorProps) {
  return (
    <div className="rounded border border-[#222222]/15 bg-[#FFFFFF] p-4 text-[0.875rem] leading-relaxed text-[#222222]">
      <p className="font-medium">Could not load Collections</p>
      <p className="mt-2 opacity-80">{message}</p>
      <p className="mt-3 opacity-70">
        Local dev: run <code className="text-[0.8125rem]">npx supabase start</code>
        , then <code className="text-[0.8125rem]">npm run sync-dev-supabase-env</code>
        , and restart <code className="text-[0.8125rem]">npm run dev</code>.
      </p>
    </div>
  );
}

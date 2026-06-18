import Link from "next/link";
import { Navbar } from "@/components/Navbar";

export default function HomePage() {
  return (
    <div>
      <Navbar />
      <main className="mx-auto max-w-4xl px-4 py-8">
        <h1 className="text-2xl font-bold">Echo Speak</h1>
        <p className="mt-2 text-gray-600">
          Turn video transcripts into expressions you actually remember.
        </p>
        <div className="mt-6 flex gap-4">
          <Link
            href="/import"
            className="rounded bg-black px-4 py-2 text-white hover:bg-gray-800"
          >
            Import transcript
          </Link>
          <Link
            href="/review"
            className="rounded border px-4 py-2 hover:bg-gray-50"
          >
            Start review
          </Link>
        </div>
      </main>
    </div>
  );
}

import { Navbar } from "@/components/Navbar";

export default function GapsPage() {
  return (
    <div>
      <Navbar />
      <main className="mx-auto max-w-4xl px-4 py-8">
        <h1 className="text-xl font-bold">Knowledge Gaps</h1>
        <p className="mt-2 text-sm text-gray-600">
          Phrases you encounter but have not mastered.
        </p>
        <p className="mt-8 text-center text-gray-400">No gaps detected.</p>
      </main>
    </div>
  );
}

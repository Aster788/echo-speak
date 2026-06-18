import { Navbar } from "@/components/Navbar";

export default function LibraryPage() {
  return (
    <div>
      <Navbar />
      <main className="mx-auto max-w-4xl px-4 py-8">
        <h1 className="text-xl font-bold">Expression Library</h1>
        <p className="mt-2 text-sm text-gray-600">
          All expressions extracted from your transcripts.
        </p>
        <p className="mt-8 text-center text-gray-400">No expressions yet.</p>
      </main>
    </div>
  );
}

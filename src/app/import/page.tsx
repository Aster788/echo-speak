import { Navbar } from "@/components/Navbar";

export default function ImportPage() {
  return (
    <div>
      <Navbar />
      <main className="mx-auto max-w-4xl px-4 py-8">
        <h1 className="text-xl font-bold">Import Transcript</h1>
        <p className="mt-2 text-sm text-gray-600">
          Paste a raw transcript to clean and extract expressions.
        </p>
        <form className="mt-6 space-y-4">
          <input
            type="text"
            placeholder="Video title"
            className="w-full rounded border px-3 py-2"
          />
          <textarea
            placeholder="Raw transcript..."
            rows={12}
            className="w-full rounded border px-3 py-2 font-mono text-sm"
          />
          <button
            type="submit"
            className="rounded bg-black px-4 py-2 text-white hover:bg-gray-800"
          >
            Import
          </button>
        </form>
      </main>
    </div>
  );
}

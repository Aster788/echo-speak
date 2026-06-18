import { Navbar } from "@/components/Navbar";

export default function ReviewPage() {
  return (
    <div>
      <Navbar />
      <main className="mx-auto max-w-4xl px-4 py-8">
        <h1 className="text-xl font-bold">Review</h1>
        <p className="mt-2 text-sm text-gray-600">
          Spaced-repetition cards due today.
        </p>
        <p className="mt-8 text-center text-gray-400">No reviews due.</p>
      </main>
    </div>
  );
}

import { Navbar } from "@/components/Navbar";
import { ImportForm } from "./ImportForm";

export default function ImportPage() {
  return (
    <div className="min-h-screen bg-[#FFFFFF]">
      <Navbar />
      <main className="mx-auto w-full max-w-[430px] px-4 py-8">
        <h1 className="text-xl font-light text-[#222222]">Import Transcript</h1>
        <p className="mt-2 text-sm text-[#222222]">
          Upload or paste a YouTube transcript to clean and save.
        </p>
        <div className="mt-6">
          <ImportForm />
        </div>
      </main>
    </div>
  );
}

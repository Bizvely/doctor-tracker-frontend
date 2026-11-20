"use client";

import { Button } from "@/components/ui/Button";

// অপ্রত্যাশিত ভুলে পুরো পাতা সাদা না হয়ে এই পাতা দেখায়
export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-3 px-6 text-center">
      <h1 className="text-2xl font-semibold text-slate-900">Something went wrong</h1>
      <p className="max-w-sm text-sm text-slate-500">An unexpected error occurred. Please try again.</p>
      <Button onClick={reset} className="mt-2">
        Try again
      </Button>
    </main>
  );
}

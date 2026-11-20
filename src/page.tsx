"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

// মূল ঠিকানা (/) খুললে Dashboard-এ পাঠায়। Login না থাকলে পরের ধাপের guard login পাতায় নেবে।
export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/dashboard");
  }, [router]);

  return (
    <main className="flex min-h-screen items-center justify-center">
      <p className="text-sm text-slate-500">Loading...</p>
    </main>
  );
}

"use client";

import { HeartPulse, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { useAuth } from "@/providers/AuthProvider";

// কত সেকেন্ড পরে "সার্ভার জাগছে" বার্তা দেখানো হবে
const SLOW_AFTER_SECONDS = 4;

// loader কতক্ষণ ধরে দেখা যাচ্ছে (সেকেন্ডে)
function useElapsedSeconds(): number {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => setSeconds((value) => value + 1), 1000);
    return () => window.clearInterval(id);
  }, []);

  return seconds;
}

// পুরো পর্দা জুড়ে loading পাতা। Render-এর free server ঘুমিয়ে থাকলে প্রথম লোডে ৩০–৬০ সেকেন্ড লাগে,
// তাই দেরি হলে বোঝানো হয় যে সাইট ভাঙেনি, শুধু server জাগছে।
export function FullPageLoader() {
  const seconds = useElapsedSeconds();
  const isSlow = seconds >= SLOW_AFTER_SECONDS;

  return (
    <div role="status" className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <span className="flex h-14 w-14 animate-pulse items-center justify-center rounded-2xl bg-brand-700 text-white shadow-lg">
        <HeartPulse className="h-7 w-7" aria-hidden="true" />
      </span>

      <p className="mt-5 text-xl font-semibold text-slate-900">Doctor Tracker</p>
      <p className="mt-1 text-sm text-slate-500">Care Guide BD · Admin portal</p>

      <p className="mt-6 flex items-center gap-2 text-sm text-slate-700">
        <Loader2 className="h-4 w-4 animate-spin text-brand-700" aria-hidden="true" />
        {isSlow ? "Waking up the server…" : "Loading…"}
      </p>

      {isSlow && (
        <div className="mt-4 max-w-sm rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600 shadow-sm">
          <p>
            This project runs on a free hosting plan that sleeps when idle. The first visit can take up to 60
            seconds. Thank you for your patience!
          </p>
          {/* সংখ্যা প্রতি সেকেন্ডে বদলায়, তাই screen reader-কে বারবার পড়তে হয় না */}
          <p aria-hidden="true" className="mt-2 text-xs tabular-nums text-slate-400">
            Waiting {seconds}s
          </p>
        </div>
      )}
    </div>
  );
}

// Login না থাকলে ভেতরের কোনো পাতা দেখানো হয় না, login পাতায় পাঠানো হয়।
// মনে রাখবেন: আসল সুরক্ষা backend-এ। এটা শুধু ব্যবহারকারীর সুবিধার জন্য।
export function AuthGuard({ children }: { children: ReactNode }) {
  const { status } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/admin-login");
  }, [status, router]);

  if (status !== "authenticated") return <FullPageLoader />;
  return <>{children}</>;
}

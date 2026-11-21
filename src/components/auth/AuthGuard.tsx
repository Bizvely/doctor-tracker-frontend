"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useAuth } from "@/providers/AuthProvider";

// পুরো পর্দা জুড়ে ছোট loading চিহ্ন
export function FullPageLoader() {
  return (
    <div role="status" className="flex min-h-screen items-center justify-center">
      <Loader2 className="h-6 w-6 animate-spin text-brand-700" aria-hidden="true" />
      <span className="sr-only">Loading...</span>
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

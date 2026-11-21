"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { ToastProvider } from "@/components/ui/Toast";
import { ApiClientError } from "@/lib/api";
import { AuthProvider } from "@/providers/AuthProvider";

// সব data-fetching, বার্তা ও login অবস্থা এক জায়গায়
export function Providers({ children }: { children: ReactNode }) {
  // useState দিয়ে বানানো: re-render হলেও cache হারায় না
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // ৩০ সেকেন্ড পর্যন্ত একই data আবার চাওয়া হয় না (দ্রুত navigation, কম request)
            staleTime: 30_000,
            refetchOnWindowFocus: false,
            // ৪xx error (যেমন 401, 404) আবার চেষ্টা করে লাভ নেই; নেটওয়ার্ক/সার্ভার সমস্যায় ১ বার আবার চেষ্টা
            retry: (failureCount, error) => {
              if (error instanceof ApiClientError && error.status >= 400 && error.status < 500) return false;
              return failureCount < 1;
            },
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <AuthProvider>{children}</AuthProvider>
      </ToastProvider>
    </QueryClientProvider>
  );
}

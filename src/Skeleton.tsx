import { cn } from "@/lib/cn";

// লোড হওয়ার সময় ধূসর জায়গা-ধরা বাক্স (স্ক্রিন লাফানো কমায়)
export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cn("animate-pulse rounded-md bg-slate-200", className)} />;
}

import { ArrowDown, ArrowUp, Minus } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";
import { Skeleton } from "./Skeleton";

// আগের সময়ের সাথে তুলনার তথ্য
interface StatTrend {
  current: number;
  previous: number;
  // যেমন "yesterday" বা "previous 7 days"
  previousLabel: string;
}

interface StatCardProps {
  label: string;
  value: number | string;
  icon: LucideIcon;
  hint?: string;
  loading?: boolean;
  trend?: StatTrend;
}

// আগের সময়ের চেয়ে কত শতাংশ বাড়ল/কমল, তা থেকে লেখা ও রং ঠিক করা
function describeTrend({ current, previous }: StatTrend): {
  text: string;
  tone: "up" | "down" | "flat";
} {
  if (previous === 0) {
    // আগে ০ ছিল: শতাংশ হিসাব করা যায় না
    return current > 0 ? { text: "Up from 0", tone: "up" } : { text: "No change", tone: "flat" };
  }
  const percent = Math.round(((current - previous) / previous) * 100);
  if (percent > 0) return { text: `+${percent}%`, tone: "up" };
  if (percent < 0) return { text: `${percent}%`, tone: "down" };
  return { text: "No change", tone: "flat" };
}

function TrendLine({ trend }: { trend: StatTrend }) {
  const { text, tone } = describeTrend(trend);
  const Icon = tone === "up" ? ArrowUp : tone === "down" ? ArrowDown : Minus;

  return (
    <p className="mt-1 flex flex-wrap items-center gap-x-1.5 text-sm">
      <span
        className={cn(
          "inline-flex items-center gap-0.5 font-medium",
          tone === "up" && "text-green-700",
          tone === "down" && "text-red-700",
          tone === "flat" && "text-slate-500"
        )}
      >
        <Icon className="h-3.5 w-3.5" aria-hidden="true" />
        {text}
      </span>
      <span className="text-slate-500">
        vs {trend.previousLabel} ({trend.previous})
      </span>
    </p>
  );
}

// Dashboard-এর সংখ্যার কার্ড
export function StatCard({ label, value, icon: Icon, hint, loading = false, trend }: StatCardProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-card">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
      </div>
      {loading ? (
        <>
          <Skeleton className="mt-3 h-8 w-20" />
          <Skeleton className="mt-2 h-4 w-28" />
        </>
      ) : (
        <>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">{value}</p>
          {trend && <TrendLine trend={trend} />}
          {hint && <p className="mt-1 text-sm text-slate-500">{hint}</p>}
        </>
      )}
    </div>
  );
}

import type { LucideIcon } from "lucide-react";
import { Skeleton } from "./Skeleton";

interface StatCardProps {
  label: string;
  value: number | string;
  icon: LucideIcon;
  hint?: string;
  loading?: boolean;
}

// Dashboard-এর সংখ্যার কার্ড
export function StatCard({ label, value, icon: Icon, hint, loading = false }: StatCardProps) {
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
          {hint && <p className="mt-1 text-sm text-slate-500">{hint}</p>}
        </>
      )}
    </div>
  );
}

"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import {
  BarChart3,
  CalendarCheck,
  CalendarRange,
  CheckCircle2,
  Database,
  Gauge,
  RefreshCw,
  Server,
  Stethoscope,
  Users,
  XCircle,
} from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { StatCard } from "@/components/ui/StatCard";
import { api, getErrorMessage } from "@/lib/api";
import { cn } from "@/lib/cn";
import type { ApiItem, DashboardRange, DashboardStats, HealthResponse } from "@/types";
import { LoadDemoDataButton } from "./LoadDemoDataButton";

// toggle-এ যে কয়টা সময় দেখানো হবে
const RANGE_OPTIONS: DashboardRange[] = [7, 30, 90];

// Chart library ভারী, তাই শুধু দরকারের সময় আলাদাভাবে লোড হয় (পাতা দ্রুত খোলে)
function ChartsSkeleton() {
  return (
    <div className="grid gap-4 lg:grid-cols-2" aria-hidden="true">
      <Skeleton className="h-80 lg:col-span-2" />
      <Skeleton className="h-72" />
      <Skeleton className="h-72" />
    </div>
  );
}

const DashboardCharts = dynamic(() => import("./DashboardCharts").then((module) => module.DashboardCharts), {
  ssr: false,
  loading: () => <ChartsSkeleton />,
});

// "20 Nov 2026, 14:05" ধরনের আন্তর্জাতিক তারিখ
function formatUpdatedAt(stats: DashboardStats): string {
  try {
    return new Date(stats.generatedAt).toLocaleString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: stats.timezone,
    });
  } catch {
    return stats.generatedAt;
  }
}

// ৭ / ৩০ / ৯০ দিনের বাছাই বোতাম
function RangeToggle({ value, onChange }: { value: DashboardRange; onChange: (next: DashboardRange) => void }) {
  return (
    <div role="group" aria-label="Date range" className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5">
      {RANGE_OPTIONS.map((option) => {
        const active = option === value;
        return (
          <button
            key={option}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(option)}
            className={cn(
              "h-8 rounded-md px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600",
              active ? "bg-brand-700 text-white" : "text-slate-600 hover:bg-slate-100"
            )}
          >
            {option} days
          </button>
        );
      })}
    </div>
  );
}

function SystemStatus() {
  const health = useQuery({
    queryKey: ["health"],
    queryFn: ({ signal }) => api.get<HealthResponse>("/health", { signal }),
  });

  return (
    <section aria-labelledby="system-status" className="rounded-xl border border-slate-200 bg-white p-5 shadow-card">
      <div className="flex items-center justify-between gap-3">
        <h2 id="system-status" className="text-base font-semibold text-slate-900">
          System status
        </h2>
        <Button variant="secondary" size="sm" onClick={() => void health.refetch()} loading={health.isFetching}>
          {!health.isFetching && <RefreshCw className="h-4 w-4" aria-hidden="true" />}
          Check again
        </Button>
      </div>

      {health.isPending ? (
        <div className="mt-4 space-y-3">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-5 w-40" />
        </div>
      ) : health.isError ? (
        <div role="alert" className="mt-4 flex items-start gap-3 rounded-lg bg-red-50 p-4 text-sm text-red-800">
          <XCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
          <p>{getErrorMessage(health.error)}</p>
        </div>
      ) : (
        <ul className="mt-4 space-y-3 text-sm">
          <li className="flex items-center gap-2 text-slate-700">
            <Server className="h-5 w-5 text-slate-400" aria-hidden="true" />
            API server:
            <span className="inline-flex items-center gap-1 font-medium text-green-700">
              <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
              {health.data.status === "ok" ? "Online" : health.data.status}
            </span>
          </li>
          <li className="flex items-center gap-2 text-slate-700">
            <Database className="h-5 w-5 text-slate-400" aria-hidden="true" />
            Database:
            <span
              className={
                health.data.db === "connected"
                  ? "inline-flex items-center gap-1 font-medium text-green-700"
                  : "inline-flex items-center gap-1 font-medium text-red-700"
              }
            >
              {health.data.db === "connected" ? (
                <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
              ) : (
                <XCircle className="h-4 w-4" aria-hidden="true" />
              )}
              {health.data.db === "connected" ? "Connected" : "Disconnected"}
            </span>
          </li>
        </ul>
      )}
    </section>
  );
}

export function DashboardView() {
  // কত দিনের হিসাব দেখানো হবে (শুরুতে ৩০)
  const [range, setRange] = useState<DashboardRange>(30);

  const stats = useQuery({
    // range বদলালে নতুন করে data আসে; আগের data দেখানো থাকে, তাই পাতা ঝিলিক দেয় না
    queryKey: ["dashboard", "stats", range],
    queryFn: ({ signal }) => api.get<ApiItem<DashboardStats>>("/api/dashboard/stats", { query: { range }, signal }),
    select: (response) => response.data,
    placeholderData: keepPreviousData,
  });

  const data = stats.data;
  const isEmpty = data !== undefined && data.totals.doctors === 0 && data.totals.patients === 0;

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Overview of doctors and patients."
        actions={
          <div className="flex flex-wrap items-center justify-end gap-2">
            <RangeToggle value={range} onChange={setRange} />
            <Button variant="secondary" size="sm" onClick={() => void stats.refetch()} loading={stats.isFetching}>
              {!stats.isFetching && <RefreshCw className="h-4 w-4" aria-hidden="true" />}
              Refresh
            </Button>
          </div>
        }
      />

      {stats.isError ? (
        <div role="alert" className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-800">
          <XCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
          <div>
            <p className="font-medium">Could not load dashboard statistics.</p>
            <p className="mt-1">{getErrorMessage(stats.error)}</p>
            <Button variant="secondary" size="sm" className="mt-3" onClick={() => void stats.refetch()}>
              Try again
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-5">
            <StatCard label="Total doctors" value={data?.totals.doctors ?? 0} icon={Stethoscope} loading={!data} />
            <StatCard label="Total patients" value={data?.totals.patients ?? 0} icon={Users} loading={!data} />
            <StatCard
              label="Visits today"
              value={data?.visits.today.current ?? 0}
              icon={CalendarCheck}
              loading={!data}
              trend={data ? { ...data.visits.today, previousLabel: "yesterday" } : undefined}
            />
            <StatCard
              label={`Visits, last ${data?.range ?? range} days`}
              value={data?.visits.period.current ?? 0}
              icon={CalendarRange}
              loading={!data}
              trend={data ? { ...data.visits.period, previousLabel: `previous ${data.range} days` } : undefined}
            />
            <StatCard
              label="Avg. visits per day"
              value={data?.visits.averagePerDay.current ?? 0}
              icon={Gauge}
              loading={!data}
              trend={data ? { ...data.visits.averagePerDay, previousLabel: `previous ${data.range} days` } : undefined}
            />
          </div>

          <div className="mt-6">
            {!data ? (
              <ChartsSkeleton />
            ) : isEmpty ? (
              <div className="rounded-xl border border-slate-200 bg-white shadow-card">
                <EmptyState
                  icon={BarChart3}
                  title="No data yet"
                  description="Add doctors and patients to see statistics and charts here, or load sample data to explore the app."
                  action={
                    <div className="flex flex-col items-center gap-3 sm:flex-row">
                      <Link
                        href="/doctors"
                        className="inline-flex h-10 items-center rounded-lg bg-brand-700 px-4 text-sm font-medium text-white hover:bg-brand-800"
                      >
                        Go to Doctors
                      </Link>
                      <LoadDemoDataButton />
                    </div>
                  }
                />
              </div>
            ) : (
              <DashboardCharts stats={data} />
            )}
          </div>

          {data && (
            <p className="mt-4 text-xs text-slate-500">
              Updated {formatUpdatedAt(data)}. Dates are shown in {data.timezone} time.
            </p>
          )}
        </>
      )}

      <div className="mt-6">
        <SystemStatus />
      </div>
    </>
  );
}

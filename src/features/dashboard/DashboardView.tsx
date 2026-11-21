"use client";

import { useQuery } from "@tanstack/react-query";
import {
  BarChart3,
  CalendarCheck,
  CalendarDays,
  CalendarRange,
  CheckCircle2,
  Database,
  RefreshCw,
  Server,
  Stethoscope,
  Users,
  XCircle,
} from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { StatCard } from "@/components/ui/StatCard";
import { api, getErrorMessage } from "@/lib/api";
import type { ApiItem, DashboardStats, HealthResponse } from "@/types";
import { LoadDemoDataButton } from "./LoadDemoDataButton";

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
  const stats = useQuery({
    queryKey: ["dashboard", "stats"],
    queryFn: ({ signal }) => api.get<ApiItem<DashboardStats>>("/api/dashboard/stats", { signal }),
    select: (response) => response.data,
  });

  const data = stats.data;
  const isEmpty = data !== undefined && data.totals.doctors === 0 && data.totals.patients === 0;

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Overview of doctors and patients."
        actions={
          <Button variant="secondary" size="sm" onClick={() => void stats.refetch()} loading={stats.isFetching}>
            {!stats.isFetching && <RefreshCw className="h-4 w-4" aria-hidden="true" />}
            Refresh
          </Button>
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
            <StatCard label="Visits today" value={data?.visits.today ?? 0} icon={CalendarCheck} loading={!data} />
            <StatCard label="Visits, last 7 days" value={data?.visits.last7Days ?? 0} icon={CalendarDays} loading={!data} />
            <StatCard
              label="Visits, last 30 days"
              value={data?.visits.last30Days ?? 0}
              icon={CalendarRange}
              loading={!data}
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

"use client";

import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Database, RefreshCw, Server, XCircle } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { api, getErrorMessage } from "@/lib/api";
import type { HealthResponse } from "@/types";

// ধাপ ৬: ভিত্তি যাচাই। এই পাতা দেখায় frontend ↔ API সংযোগ (ঠিকানা, CORS, HTTPS) কাজ করছে কিনা।
// আসল Dashboard (সংখ্যা ও chart) ধাপ ৮-এ আসবে।
export function DashboardView() {
  const health = useQuery({
    queryKey: ["health"],
    queryFn: ({ signal }) => api.get<HealthResponse>("/health", { signal }),
  });

  return (
    <>
      <PageHeader title="Dashboard" description="Overview of doctors and patients." />

      <section aria-labelledby="system-status" className="rounded-xl border border-slate-200 bg-white p-5 shadow-card">
        <div className="flex items-center justify-between gap-3">
          <h2 id="system-status" className="text-base font-semibold text-slate-900">
            System status
          </h2>
          <Button variant="secondary" size="sm" onClick={() => health.refetch()} loading={health.isFetching}>
            {!health.isFetching && <RefreshCw className="h-4 w-4" aria-hidden="true" />}
            Check again
          </Button>
        </div>

        {health.isPending ? (
          <div className="mt-4 space-y-3">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-5 w-40" />
            <p className="text-sm text-slate-500">Connecting to the API. The free server can take up to a minute to wake up.</p>
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
                {health.data.db === "connected" ? <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> : <XCircle className="h-4 w-4" aria-hidden="true" />}
                {health.data.db === "connected" ? "Connected" : "Disconnected"}
              </span>
            </li>
          </ul>
        )}
      </section>
    </>
  );
}

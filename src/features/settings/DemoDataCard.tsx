"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Skeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import { api, getErrorMessage } from "@/lib/api";
import { cn } from "@/lib/cn";
import type { ApiItem, ApiMessage } from "@/types";

interface DemoStatus {
  // demo ডাক্তার এখন আছে কিনা
  loaded: boolean;
  demoDoctors: number;
  demoPatients: number;
  // database সম্পূর্ণ ফাঁকা থাকলে true (তখনই demo লোড করা যায়)
  canLoad: boolean;
}

// Demo data on/off: ON করলে নমুনা data আসে, OFF করলে শুধু নমুনা data মুছে যায়
export function DemoDataCard() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const status = useQuery({
    queryKey: ["dashboard", "demo-status"],
    queryFn: ({ signal }) => api.get<ApiItem<DemoStatus>>("/api/dashboard/demo-status", { signal }),
    select: (response) => response.data,
  });

  // বদলের পর Dashboard, Doctors, Patients সব নতুন করে আনা
  const refreshAll = (): void => {
    for (const key of ["dashboard", "doctors", "patients"]) {
      void queryClient.invalidateQueries({ queryKey: [key] });
    }
  };

  const turnOn = useMutation({
    mutationFn: () => api.post<ApiMessage>("/api/dashboard/demo-data"),
    onSuccess: () => {
      refreshAll();
      toast.success("Demo data is on");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const turnOff = useMutation({
    mutationFn: () => api.delete<ApiMessage>("/api/dashboard/demo-data"),
    onSuccess: () => {
      setConfirmOpen(false);
      refreshAll();
      toast.success("Demo data removed");
    },
  });

  const data = status.data;
  const isOn = data?.loaded ?? false;
  const busy = turnOn.isPending || turnOff.isPending;
  // OFF অবস্থায় শুধু ফাঁকা database-এ ON করা যায়
  const blocked = !isOn && data !== undefined && !data.canLoad;
  const disabled = !data || busy || blocked;

  const handleToggle = (): void => {
    if (isOn) {
      turnOff.reset();
      setConfirmOpen(true);
    } else {
      turnOn.mutate();
    }
  };

  return (
    <section aria-labelledby="demo-heading" className="rounded-xl border border-slate-200 bg-white p-5 shadow-card">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 id="demo-heading" className="text-base font-semibold text-slate-900">
            Demo data
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Sample doctors and patients to explore the app. Turning it off removes only the sample records, never
            the ones you added.
          </p>
        </div>

        {status.isPending ? (
          <Skeleton className="h-6 w-11 shrink-0 rounded-full" />
        ) : (
          <button
            type="button"
            role="switch"
            aria-checked={isOn}
            aria-label="Demo data"
            disabled={disabled}
            onClick={handleToggle}
            className={cn(
              "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2",
              "disabled:cursor-not-allowed disabled:opacity-60",
              isOn ? "bg-brand-700" : "bg-slate-300"
            )}
          >
            <span
              aria-hidden="true"
              className={cn(
                "inline-block h-5 w-5 rounded-full bg-white shadow transition-transform",
                isOn ? "translate-x-5" : "translate-x-0.5"
              )}
            />
          </button>
        )}
      </div>

      {status.isError ? (
        <div role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          <p>{getErrorMessage(status.error)}</p>
          <Button variant="secondary" size="sm" className="mt-2" onClick={() => void status.refetch()}>
            Try again
          </Button>
        </div>
      ) : data ? (
        <p className="mt-4 text-sm text-slate-700">
          {isOn ? (
            <>
              <span className="font-medium text-green-700">On</span>: {data.demoDoctors} demo doctors and{" "}
              {data.demoPatients} demo patients.
            </>
          ) : blocked ? (
            <>
              <span className="font-medium text-slate-900">Off</span>. Demo data can only be turned on when there are
              no doctors or patients in the database.
            </>
          ) : (
            <>
              <span className="font-medium text-slate-900">Off</span>. Turn it on to add sample doctors and patients.
            </>
          )}
        </p>
      ) : null}

      <ConfirmDialog
        open={confirmOpen}
        title="Turn off demo data?"
        description="This permanently deletes the sample doctors and patients. Doctors and patients you added yourself are not touched."
        confirmLabel="Remove demo data"
        loading={turnOff.isPending}
        error={turnOff.isError ? getErrorMessage(turnOff.error) : null}
        onConfirm={() => turnOff.mutate()}
        onCancel={() => setConfirmOpen(false)}
      />
    </section>
  );
}

"use client";

import { Users } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";

// ধাপ ১০-এ এখানে রোগীর তালিকা, search, filter ও edit আসবে
export function PatientsView() {
  return (
    <>
      <PageHeader title="Patients" description="View and manage all patients." />
      <div className="rounded-xl border border-slate-200 bg-white shadow-card">
        <EmptyState icon={Users} title="Patients list is coming next" description="This page will list, search and filter patients." />
      </div>
    </>
  );
}

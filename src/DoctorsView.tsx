"use client";

import { Stethoscope } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";

// ধাপ ৯-এ এখানে ডাক্তারের তালিকা, search, filter ও form আসবে
export function DoctorsView() {
  return (
    <>
      <PageHeader title="Doctors" description="Manage doctors and view their patients." />
      <div className="rounded-xl border border-slate-200 bg-white shadow-card">
        <EmptyState icon={Stethoscope} title="Doctors list is coming next" description="This page will list, search and filter doctors." />
      </div>
    </>
  );
}

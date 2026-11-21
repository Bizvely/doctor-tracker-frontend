"use client";

import { XCircle } from "lucide-react";
import { useMemo } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { cn } from "@/lib/cn";
import type { DoctorRef } from "@/types";
import type { PatientFilters } from "./usePatientFilters";

interface PatientFiltersBarProps {
  filters: PatientFilters;
  updateUrl: (changes: Partial<PatientFilters>) => void;
  searchInput: string;
  onSearchInputChange: (value: string) => void;
  conditions: string[];
  // দিলে "ডাক্তার" filter দেখায় (শুধু Patients পাতায়)
  doctors?: DoctorRef[];
  hasFilters: boolean;
  onClear: () => void;
}

// URL-এ থাকা মান dropdown-এর তালিকায় না থাকলেও যেন দেখা যায়
function withCurrent(list: string[], current: string): string[] {
  return current && !list.includes(current) ? [...list, current] : list;
}

export function PatientFiltersBar({
  filters,
  updateUrl,
  searchInput,
  onSearchInputChange,
  conditions,
  doctors,
  hasFilters,
  onClear,
}: PatientFiltersBarProps) {
  const conditionList = useMemo(() => withCurrent(conditions, filters.condition), [conditions, filters.condition]);

  return (
    <section aria-label="Search and filters" className="mb-4 rounded-xl border border-slate-200 bg-white p-4 shadow-card">
      <div className="grid gap-3 sm:grid-cols-[1fr_13rem]">
        <Input
          label="Search patients"
          hideLabel
          placeholder="Search by patient name or phone"
          value={searchInput}
          maxLength={60}
          onChange={(event) => onSearchInputChange(event.target.value)}
        />
        <Select
          label="Sort by"
          hideLabel
          value={filters.sort}
          onChange={(event) => updateUrl({ sort: event.target.value as PatientFilters["sort"] })}
        >
          <option value="newest">Latest visit first</option>
          <option value="oldest">Oldest visit first</option>
          <option value="name">Name (A-Z)</option>
        </Select>
      </div>

      <div className={cn("mt-3 grid gap-3 sm:grid-cols-2", doctors ? "lg:grid-cols-4" : "lg:grid-cols-3")}>
        <Select label="Condition" value={filters.condition} onChange={(event) => updateUrl({ condition: event.target.value })}>
          <option value="">All conditions</option>
          {conditionList.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </Select>

        {doctors && (
          <Select label="Doctor" value={filters.doctorId} onChange={(event) => updateUrl({ doctorId: event.target.value })}>
            <option value="">All doctors</option>
            {doctors.map((doctor) => (
              <option key={doctor._id} value={doctor._id}>
                {doctor.name} ({doctor.specialization})
              </option>
            ))}
          </Select>
        )}

        <Input
          label="Visit from"
          type="date"
          value={filters.from}
          max={filters.to || undefined}
          onChange={(event) => updateUrl({ from: event.target.value })}
        />
        <Input
          label="Visit to"
          type="date"
          value={filters.to}
          min={filters.from || undefined}
          onChange={(event) => updateUrl({ to: event.target.value })}
        />
      </div>

      {hasFilters && (
        <div className="mt-3 flex justify-end">
          <Button variant="ghost" size="sm" onClick={onClear}>
            <XCircle className="h-4 w-4" aria-hidden="true" />
            Clear filters
          </Button>
        </div>
      )}
    </section>
  );
}

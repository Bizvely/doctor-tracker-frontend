"use client";

import { XCircle } from "lucide-react";
import { useMemo } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import type { DoctorFilters } from "./useDoctorFilters";

interface DoctorFiltersBarProps {
  filters: DoctorFilters;
  updateUrl: (changes: Partial<DoctorFilters>) => void;
  searchInput: string;
  onSearchInputChange: (value: string) => void;
  specializations: string[];
  hospitals: string[];
  hasFilters: boolean;
  onClear: () => void;
}

// filter list-এ বর্তমান বাছাই করা মান না থাকলেও সেটা দেখানোর জন্য যোগ করা
function withCurrent(list: string[], current: string): string[] {
  return current && !list.includes(current) ? [...list, current] : list;
}

// Search, sort ও filter-এর অংশ
export function DoctorFiltersBar({
  filters,
  updateUrl,
  searchInput,
  onSearchInputChange,
  specializations,
  hospitals,
  hasFilters,
  onClear,
}: DoctorFiltersBarProps) {
  const specializationList = useMemo(
    () => withCurrent(specializations, filters.specialization),
    [specializations, filters.specialization]
  );
  const hospitalList = useMemo(() => withCurrent(hospitals, filters.hospital), [hospitals, filters.hospital]);

  return (
    <section aria-label="Search and filters" className="mb-4 rounded-xl border border-slate-200 bg-white p-4 shadow-card">
      <div className="grid gap-3 sm:grid-cols-[1fr_12rem]">
        <Input
          label="Search doctors"
          hideLabel
          placeholder="Search by name, email, hospital or specialization"
          value={searchInput}
          maxLength={60}
          onChange={(event) => onSearchInputChange(event.target.value)}
        />
        <Select
          label="Sort by"
          hideLabel
          value={filters.sort}
          onChange={(event) => updateUrl({ sort: event.target.value as DoctorFilters["sort"] })}
        >
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="name">Name (A-Z)</option>
        </Select>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Select
          label="Specialization"
          value={filters.specialization}
          onChange={(event) => updateUrl({ specialization: event.target.value })}
        >
          <option value="">All specializations</option>
          {specializationList.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </Select>
        <Select label="Hospital" value={filters.hospital} onChange={(event) => updateUrl({ hospital: event.target.value })}>
          <option value="">All hospitals</option>
          {hospitalList.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </Select>
        <Input
          label="Added from"
          type="date"
          value={filters.from}
          max={filters.to || undefined}
          onChange={(event) => updateUrl({ from: event.target.value })}
        />
        <Input
          label="Added to"
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

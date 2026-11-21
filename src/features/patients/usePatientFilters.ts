"use client";

import { useQuery } from "@tanstack/react-query";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { api } from "@/lib/api";
import { useDebouncedValue } from "@/lib/useDebouncedValue";
import type { ApiItem, DoctorRef } from "@/types";

export const PATIENT_PAGE_SIZE = 10;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const OBJECT_ID_PATTERN = /^[a-f\d]{24}$/i;

export type PatientSort = "newest" | "oldest" | "name";

export interface PatientFilters {
  search: string;
  condition: string;
  doctorId: string;
  from: string;
  to: string;
  sort: PatientSort;
  page: number;
}

export interface PatientOptions {
  conditions: string[];
  genders: string[];
  doctors: DoctorRef[];
}

// রোগের তালিকা, gender ও ডাক্তারদের তালিকা (dropdown-এর জন্য)। backend থেকেই আসে, তাই একটাই উৎস
export function usePatientOptions(enabled = true) {
  return useQuery({
    queryKey: ["patients", "options"],
    queryFn: ({ signal }) => api.get<ApiItem<PatientOptions>>("/api/patients/meta/options", { signal }),
    select: (response) => response.data,
    staleTime: 60_000,
    enabled,
  });
}

// URL থেকে filter পড়া। হাতে বদলানো ভুল মান বাতিল হয়
function readFilters(params: { get(name: string): string | null }, withDoctor: boolean): PatientFilters {
  const sortParam = params.get("sort");
  const pageParam = Number(params.get("page"));
  const doctorParam = params.get("doctorId") ?? "";
  let from = params.get("from") ?? "";
  let to = params.get("to") ?? "";
  if (!DATE_PATTERN.test(from)) from = "";
  if (!DATE_PATTERN.test(to)) to = "";
  // শুরুর তারিখ শেষের পরে হলে অদলবদল (backend এই অবস্থায় error দেয়)
  if (from && to && from > to) [from, to] = [to, from];

  return {
    search: (params.get("search") ?? "").slice(0, 60),
    condition: (params.get("condition") ?? "").slice(0, 40),
    doctorId: withDoctor && OBJECT_ID_PATTERN.test(doctorParam) ? doctorParam : "",
    from,
    to,
    sort: sortParam === "oldest" || sortParam === "name" ? sortParam : "newest",
    page: Number.isInteger(pageParam) && pageParam >= 1 && pageParam <= 100000 ? pageParam : 1,
  };
}

interface UsePatientFiltersOptions {
  // true হলে "ডাক্তার" filter থাকে (Patients পাতা)
  withDoctor?: boolean;
  // URL-এর যে query আলাদা রাখতে হবে (ডাক্তারের পাতায় "id")
  preserveKey?: string;
}

export function usePatientFilters({ withDoctor = false, preserveKey }: UsePatientFiltersOptions = {}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const filters = useMemo(() => readFilters(searchParams, withDoctor), [searchParams, withDoctor]);
  const preservedValue = preserveKey ? searchParams.get(preserveKey) : null;

  const updateUrl = useCallback(
    (changes: Partial<PatientFilters>) => {
      const next: PatientFilters = { ...filters, ...changes };
      // filter বদলালে প্রথম পাতায় ফেরা (শুধু পাতা বদলালে নয়)
      if (!("page" in changes)) next.page = 1;

      const params = new URLSearchParams();
      if (preserveKey && preservedValue) params.set(preserveKey, preservedValue);
      if (next.search.trim()) params.set("search", next.search.trim());
      if (next.condition) params.set("condition", next.condition);
      if (withDoctor && next.doctorId) params.set("doctorId", next.doctorId);
      if (next.from) params.set("from", next.from);
      if (next.to) params.set("to", next.to);
      if (next.sort !== "newest") params.set("sort", next.sort);
      if (next.page > 1) params.set("page", String(next.page));

      const queryString = params.toString();
      router.replace(queryString ? `${pathname}?${queryString}` : pathname, { scroll: false });
    },
    [filters, pathname, preserveKey, preservedValue, router, withDoctor]
  );

  // সর্বশেষ filters/updateUrl হাতের কাছে রাখা (debounce effect-এ পুরোনো মান ধরা এড়াতে)
  const latest = useRef({ filters, updateUrl });
  useEffect(() => {
    latest.current = { filters, updateUrl };
  });

  // Search: টাইপ থামার ৪০০ms পর URL বদলায়
  const [searchInput, setSearchInput] = useState(filters.search);
  const debouncedSearch = useDebouncedValue(searchInput, 400);
  useEffect(() => {
    const { filters: current, updateUrl: update } = latest.current;
    if (debouncedSearch.trim() !== current.search.trim()) update({ search: debouncedSearch });
  }, [debouncedSearch]);

  // API-তে শুধু পরিচিত মান যায়; ফাঁকা মান api.ts নিজেই বাদ দেয়
  const query = useMemo(
    () => ({
      search: filters.search.trim(),
      condition: filters.condition,
      doctorId: filters.doctorId,
      from: filters.from,
      to: filters.to,
      sort: filters.sort,
      page: filters.page,
      limit: PATIENT_PAGE_SIZE,
    }),
    [filters]
  );

  const hasFilters = Boolean(
    filters.search.trim() || filters.condition || filters.doctorId || filters.from || filters.to
  );

  const clearFilters = useCallback(() => {
    setSearchInput("");
    const keep = preserveKey && preservedValue ? `?${new URLSearchParams({ [preserveKey]: preservedValue }).toString()}` : "";
    router.replace(`${pathname}${keep}`, { scroll: false });
  }, [pathname, preserveKey, preservedValue, router]);

  return { filters, query, updateUrl, searchInput, setSearchInput, hasFilters, clearFilters };
}

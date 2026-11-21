"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDebouncedValue } from "@/lib/useDebouncedValue";

export const DOCTOR_PAGE_SIZE = 10;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export type DoctorSort = "newest" | "oldest" | "name";

export interface DoctorFilters {
  search: string;
  specialization: string;
  hospital: string;
  from: string;
  to: string;
  sort: DoctorSort;
  page: number;
}

export interface DoctorOptions {
  specializations: string[];
  hospitals: string[];
}

// URL থেকে filter পড়া। কেউ URL হাতে বদলে ভুল মান দিলে সেটা বাতিল (backend ভুল মান নেয় না)
function readFilters(params: { get(name: string): string | null }): DoctorFilters {
  const sortParam = params.get("sort");
  const pageParam = Number(params.get("page"));
  let from = params.get("from") ?? "";
  let to = params.get("to") ?? "";
  if (!DATE_PATTERN.test(from)) from = "";
  if (!DATE_PATTERN.test(to)) to = "";
  // শুরুর তারিখ শেষের তারিখের পরে হলে অদলবদল (backend এই অবস্থায় error দেয়)
  if (from && to && from > to) [from, to] = [to, from];

  return {
    search: (params.get("search") ?? "").slice(0, 60),
    specialization: (params.get("specialization") ?? "").slice(0, 80),
    hospital: (params.get("hospital") ?? "").slice(0, 120),
    from,
    to,
    sort: sortParam === "oldest" || sortParam === "name" ? sortParam : "newest",
    page: Number.isInteger(pageParam) && pageParam >= 1 && pageParam <= 100000 ? pageParam : 1,
  };
}

// ডাক্তারদের পাতার সব filter, search ও URL-এর কাজ এক জায়গায়
export function useDoctorFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // সব filter URL-এ থাকে: reload দিলে বা link পাঠালে একই অবস্থা ফেরে
  const filters = useMemo(() => readFilters(searchParams), [searchParams]);

  const updateUrl = useCallback(
    (changes: Partial<DoctorFilters>) => {
      const next: DoctorFilters = { ...filters, ...changes };
      // filter বদলালে প্রথম পাতায় ফেরা (শুধু পাতা বদলালে নয়)
      if (!("page" in changes)) next.page = 1;

      const params = new URLSearchParams();
      if (next.search.trim()) params.set("search", next.search.trim());
      if (next.specialization) params.set("specialization", next.specialization);
      if (next.hospital) params.set("hospital", next.hospital);
      if (next.from) params.set("from", next.from);
      if (next.to) params.set("to", next.to);
      if (next.sort !== "newest") params.set("sort", next.sort);
      if (next.page > 1) params.set("page", String(next.page));

      const queryString = params.toString();
      router.replace(queryString ? `${pathname}?${queryString}` : pathname, { scroll: false });
    },
    [filters, pathname, router]
  );

  // সবসময় সর্বশেষ filters/updateUrl হাতের কাছে রাখা (debounce effect-এ পুরোনো মান ধরা এড়াতে)
  const latest = useRef({ filters, updateUrl });
  useEffect(() => {
    latest.current = { filters, updateUrl };
  });

  // effect-এর ভেতর থেকে ডাকার জন্য: identity বদলায় না, সবসময় সর্বশেষ updateUrl চালায়
  const updateUrlLatest = useCallback((changes: Partial<DoctorFilters>) => {
    latest.current.updateUrl(changes);
  }, []);

  // Search: টাইপ থামার ৪০০ms পর URL বদলায়
  const [searchInput, setSearchInput] = useState(filters.search);
  const debouncedSearch = useDebouncedValue(searchInput, 400);
  useEffect(() => {
    const { filters: current, updateUrl: update } = latest.current;
    if (debouncedSearch.trim() !== current.search.trim()) update({ search: debouncedSearch });
  }, [debouncedSearch]);

  const hasFilters = Boolean(filters.search.trim() || filters.specialization || filters.hospital || filters.from || filters.to);

  const clearFilters = useCallback(() => {
    setSearchInput("");
    router.replace(pathname, { scroll: false });
  }, [pathname, router]);

  return { filters, updateUrl, updateUrlLatest, searchInput, setSearchInput, hasFilters, clearFilters };
}

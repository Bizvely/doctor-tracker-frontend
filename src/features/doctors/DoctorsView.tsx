"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Eye, Pencil, Plus, Stethoscope, Trash2, XCircle } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { Pagination } from "@/components/ui/Pagination";
import { Select } from "@/components/ui/Select";
import { Skeleton } from "@/components/ui/Skeleton";
import { Table, TBody, Td, Th, THead, Tr } from "@/components/ui/Table";
import { useToast } from "@/components/ui/Toast";
import { api, getErrorMessage } from "@/lib/api";
import { cn } from "@/lib/cn";
import { formatDate } from "@/lib/format";
import { useDebouncedValue } from "@/lib/useDebouncedValue";
import type { ApiItem, ApiList, ApiMessage, Doctor } from "@/types";
import { DoctorFormModal } from "./DoctorFormModal";

const PAGE_SIZE = 10;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

type SortKey = "newest" | "oldest" | "name";

interface DoctorFilters {
  search: string;
  specialization: string;
  hospital: string;
  from: string;
  to: string;
  sort: SortKey;
  page: number;
}

interface DoctorOptions {
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

// filter list-এ বর্তমান বাছাই করা মান না থাকলেও সেটা দেখানোর জন্য যোগ করা
function withCurrent(list: string[], current: string): string[] {
  return current && !list.includes(current) ? [...list, current] : list;
}

const ICON_BUTTON =
  "inline-flex h-8 w-8 items-center justify-center rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600";
const BADGE = "inline-flex rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-medium text-brand-800";

interface RowProps {
  doctor: Doctor;
  onEdit: (doctor: Doctor) => void;
  onDelete: (doctor: Doctor) => void;
}

function RowActions({ doctor, onEdit, onDelete }: RowProps) {
  return (
    <div className="flex justify-end gap-1">
      <Link
        href={`/doctors/view?id=${doctor._id}`}
        aria-label={`View ${doctor.name}`}
        title="View patients"
        className={cn(ICON_BUTTON, "text-slate-600 hover:bg-slate-100")}
      >
        <Eye className="h-4 w-4" aria-hidden="true" />
      </Link>
      <button
        type="button"
        onClick={() => onEdit(doctor)}
        aria-label={`Edit ${doctor.name}`}
        title="Edit"
        className={cn(ICON_BUTTON, "text-slate-600 hover:bg-slate-100")}
      >
        <Pencil className="h-4 w-4" aria-hidden="true" />
      </button>
      <button
        type="button"
        onClick={() => onDelete(doctor)}
        aria-label={`Delete ${doctor.name}`}
        title="Delete"
        className={cn(ICON_BUTTON, "text-red-700 hover:bg-red-50")}
      >
        <Trash2 className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
}

// memo: বাকি তালিকা না বদলালে সারি আবার আঁকা হয় না
const DoctorRow = memo(function DoctorRow({ doctor, onEdit, onDelete }: RowProps) {
  return (
    <Tr>
      <Td>
        <p className="font-medium text-slate-900">{doctor.name}</p>
        <a href={`mailto:${doctor.email}`} className="text-xs text-slate-500 hover:underline">
          {doctor.email}
        </a>
      </Td>
      <Td>
        <span className={BADGE}>{doctor.specialization}</span>
      </Td>
      <Td>{doctor.hospital}</Td>
      <Td className="whitespace-nowrap">
        <a href={`tel:${doctor.phone}`} className="hover:underline">
          {doctor.phone}
        </a>
      </Td>
      <Td>
        <Link href={`/doctors/view?id=${doctor._id}`} className="font-medium text-brand-700 hover:underline">
          {doctor.patientCount ?? 0}
        </Link>
      </Td>
      <Td className="whitespace-nowrap">{formatDate(doctor.createdAt)}</Td>
      <Td>
        <RowActions doctor={doctor} onEdit={onEdit} onDelete={onDelete} />
      </Td>
    </Tr>
  );
});

// মোবাইলে টেবিলের বদলে কার্ড
const DoctorCard = memo(function DoctorCard({ doctor, onEdit, onDelete }: RowProps) {
  return (
    <li className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-medium text-slate-900">{doctor.name}</p>
          <span className={cn(BADGE, "mt-1")}>{doctor.specialization}</span>
        </div>
        <RowActions doctor={doctor} onEdit={onEdit} onDelete={onDelete} />
      </div>
      <dl className="mt-3 space-y-1 text-sm text-slate-600">
        <div className="flex gap-2">
          <dt className="w-20 shrink-0 text-slate-500">Hospital</dt>
          <dd className="min-w-0">{doctor.hospital}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="w-20 shrink-0 text-slate-500">Phone</dt>
          <dd>
            <a href={`tel:${doctor.phone}`} className="hover:underline">
              {doctor.phone}
            </a>
          </dd>
        </div>
        <div className="flex gap-2">
          <dt className="w-20 shrink-0 text-slate-500">Email</dt>
          <dd className="min-w-0 break-all">{doctor.email}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="w-20 shrink-0 text-slate-500">Patients</dt>
          <dd>
            <Link href={`/doctors/view?id=${doctor._id}`} className="font-medium text-brand-700 hover:underline">
              {doctor.patientCount ?? 0}
            </Link>
          </dd>
        </div>
        <div className="flex gap-2">
          <dt className="w-20 shrink-0 text-slate-500">Added</dt>
          <dd>{formatDate(doctor.createdAt)}</dd>
        </div>
      </dl>
    </li>
  );
});

export function DoctorsView() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const toast = useToast();

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

  // Search: টাইপ থামার ৪০০ms পর URL বদলায়
  const [searchInput, setSearchInput] = useState(filters.search);
  const debouncedSearch = useDebouncedValue(searchInput, 400);
  useEffect(() => {
    const { filters: current, updateUrl: update } = latest.current;
    if (debouncedSearch.trim() !== current.search.trim()) update({ search: debouncedSearch });
  }, [debouncedSearch]);

  // API-তে শুধু পরিচিত ও ফাঁকা-নয় এমন মান যায়
  const query = useMemo(
    () => ({
      search: filters.search.trim(),
      specialization: filters.specialization,
      hospital: filters.hospital,
      from: filters.from,
      to: filters.to,
      sort: filters.sort,
      page: filters.page,
      limit: PAGE_SIZE,
    }),
    [filters]
  );

  const list = useQuery({
    queryKey: ["doctors", "list", query],
    queryFn: ({ signal }) => api.get<ApiList<Doctor>>("/api/doctors", { query, signal }),
    // পাতা বদলানোর সময় আগের তালিকা ধরে রাখে (ঝলক দেয় না)
    placeholderData: keepPreviousData,
  });

  const options = useQuery({
    queryKey: ["doctors", "options"],
    queryFn: ({ signal }) => api.get<ApiItem<DoctorOptions>>("/api/doctors/meta/options", { signal }),
    select: (response) => response.data,
    staleTime: 60_000,
  });

  const rows = list.data?.data ?? [];
  const pagination = list.data?.pagination;

  // মুছে ফেলায় বা filter-এ বর্তমান পাতা ফাঁকা হয়ে গেলে শেষ পাতায় ফেরা
  useEffect(() => {
    if (!pagination || list.isPlaceholderData) return;
    if (rows.length === 0 && filters.page > 1 && pagination.total > 0) {
      latest.current.updateUrl({ page: pagination.totalPages });
    }
  }, [pagination, rows.length, filters.page, list.isPlaceholderData]);

  const specializations = useMemo(
    () => withCurrent(options.data?.specializations ?? [], filters.specialization),
    [options.data, filters.specialization]
  );
  const hospitals = useMemo(
    () => withCurrent(options.data?.hospitals ?? [], filters.hospital),
    [options.data, filters.hospital]
  );

  const hasFilters = Boolean(filters.search.trim() || filters.specialization || filters.hospital || filters.from || filters.to);

  const clearFilters = useCallback(() => {
    setSearchInput("");
    router.replace(pathname, { scroll: false });
  }, [pathname, router]);

  // ডাক্তার যোগ/edit ফর্ম
  const [formState, setFormState] = useState<{ open: boolean; doctor: Doctor | null }>({ open: false, doctor: null });
  const openCreate = useCallback(() => setFormState({ open: true, doctor: null }), []);
  const openEdit = useCallback((doctor: Doctor) => setFormState({ open: true, doctor }), []);
  const closeForm = useCallback(() => setFormState((current) => ({ ...current, open: false })), []);

  // ডাক্তার মুছা
  const [deleting, setDeleting] = useState<Doctor | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const askDelete = useCallback((doctor: Doctor) => {
    setDeleteError(null);
    setDeleting(doctor);
  }, []);

  const deleteMutation = useMutation({
    mutationFn: (doctor: Doctor) => api.delete<ApiMessage>(`/api/doctors/${doctor._id}`),
    onSuccess: () => {
      for (const key of ["doctors", "dashboard", "patients"]) {
        void queryClient.invalidateQueries({ queryKey: [key] });
      }
      toast.success("Doctor deleted");
      // পাতার শেষ ডাক্তার মুছলে আগের পাতায় যাওয়া
      if (rows.length === 1 && filters.page > 1) updateUrl({ page: filters.page - 1 });
      setDeleting(null);
    },
    // যেমন 409: ডাক্তারের এখনো রোগী আছে। বার্তাটা বাক্সের ভেতরেই দেখানো হয়
    onError: (error) => setDeleteError(getErrorMessage(error)),
  });

  const cancelDelete = useCallback(() => {
    if (!deleteMutation.isPending) setDeleting(null);
  }, [deleteMutation.isPending]);

  const handlePageChange = useCallback((page: number) => updateUrl({ page }), [updateUrl]);

  return (
    <>
      <PageHeader
        title="Doctors"
        description="Manage doctors and see their patients."
        actions={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add doctor
          </Button>
        }
      />

      {/* Search ও filter */}
      <section aria-label="Search and filters" className="mb-4 rounded-xl border border-slate-200 bg-white p-4 shadow-card">
        <div className="grid gap-3 sm:grid-cols-[1fr_12rem]">
          <Input
            label="Search doctors"
            hideLabel
            placeholder="Search by name, email, hospital or specialization"
            value={searchInput}
            maxLength={60}
            onChange={(event) => setSearchInput(event.target.value)}
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
            {specializations.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </Select>
          <Select label="Hospital" value={filters.hospital} onChange={(event) => updateUrl({ hospital: event.target.value })}>
            <option value="">All hospitals</option>
            {hospitals.map((item) => (
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
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <XCircle className="h-4 w-4" aria-hidden="true" />
              Clear filters
            </Button>
          </div>
        )}
      </section>

      {/* তালিকা */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-card">
        {list.isPending ? (
          <div className="space-y-3 p-4" aria-busy="true">
            {Array.from({ length: 5 }, (_, index) => (
              <Skeleton key={index} className="h-12 w-full" />
            ))}
            <p className="text-sm text-slate-500">Loading doctors. The free server can take up to a minute to wake up.</p>
          </div>
        ) : list.isError && !list.data ? (
          <div role="alert" className="flex items-start gap-3 p-5 text-sm text-red-800">
            <XCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
            <div>
              <p className="font-medium">Could not load doctors.</p>
              <p className="mt-1">{getErrorMessage(list.error)}</p>
              <Button variant="secondary" size="sm" className="mt-3" onClick={() => void list.refetch()}>
                Try again
              </Button>
            </div>
          </div>
        ) : rows.length === 0 ? (
          hasFilters ? (
            <EmptyState
              icon={Stethoscope}
              title="No doctors match your filters"
              description="Try a different search or clear the filters."
              action={
                <Button variant="secondary" onClick={clearFilters}>
                  Clear filters
                </Button>
              }
            />
          ) : (
            <EmptyState
              icon={Stethoscope}
              title="No doctors yet"
              description="Add your first doctor to start tracking patients."
              action={
                <Button onClick={openCreate}>
                  <Plus className="h-4 w-4" aria-hidden="true" />
                  Add doctor
                </Button>
              }
            />
          )
        ) : (
          <div aria-busy={list.isPlaceholderData} className={cn(list.isPlaceholderData && "opacity-60 transition-opacity")}>
            <div className="hidden md:block">
              <Table>
                <THead>
                  <Tr>
                    <Th>Doctor</Th>
                    <Th>Specialization</Th>
                    <Th>Hospital</Th>
                    <Th>Phone</Th>
                    <Th>Patients</Th>
                    <Th>Added</Th>
                    <Th className="text-right">Actions</Th>
                  </Tr>
                </THead>
                <TBody>
                  {rows.map((doctor) => (
                    <DoctorRow key={doctor._id} doctor={doctor} onEdit={openEdit} onDelete={askDelete} />
                  ))}
                </TBody>
              </Table>
            </div>

            <ul className="divide-y divide-slate-100 md:hidden">
              {rows.map((doctor) => (
                <DoctorCard key={doctor._id} doctor={doctor} onEdit={openEdit} onDelete={askDelete} />
              ))}
            </ul>
          </div>
        )}

        {pagination && rows.length > 0 && (
          <Pagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            total={pagination.total}
            limit={pagination.limit}
            onPageChange={handlePageChange}
          />
        )}
      </div>

      <DoctorFormModal open={formState.open} doctor={formState.doctor} onClose={closeForm} />

      <ConfirmDialog
        open={deleting !== null}
        title="Delete doctor?"
        description={
          deleting
            ? `${deleting.name} will be permanently deleted. A doctor who still has patients cannot be deleted.`
            : ""
        }
        loading={deleteMutation.isPending}
        error={deleteError}
        onConfirm={() => {
          if (deleting) deleteMutation.mutate(deleting);
        }}
        onCancel={cancelDelete}
      />
    </>
  );
}

"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Stethoscope, XCircle } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { Pagination } from "@/components/ui/Pagination";
import { Skeleton } from "@/components/ui/Skeleton";
import { Table, TBody, Th, THead, Tr } from "@/components/ui/Table";
import { useToast } from "@/components/ui/Toast";
import { api, getErrorMessage } from "@/lib/api";
import { cn } from "@/lib/cn";
import type { ApiItem, ApiList, ApiMessage, Doctor } from "@/types";
import { DoctorFiltersBar } from "./DoctorFiltersBar";
import { DoctorFormModal } from "./DoctorFormModal";
import { DoctorCard, DoctorRow } from "./DoctorRows";
import { DOCTOR_PAGE_SIZE, useDoctorFilters, type DoctorOptions } from "./useDoctorFilters";

export function DoctorsView() {
  const queryClient = useQueryClient();
  const toast = useToast();

  // filter, search ও URL-এর সব কাজ hook-এ (আলাদা ফাইলে)
  const { filters, updateUrl, updateUrlLatest, searchInput, setSearchInput, hasFilters, clearFilters } =
    useDoctorFilters();

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
      limit: DOCTOR_PAGE_SIZE,
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
      updateUrlLatest({ page: pagination.totalPages });
    }
  }, [pagination, rows.length, filters.page, list.isPlaceholderData, updateUrlLatest]);

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
      <DoctorFiltersBar
        filters={filters}
        updateUrl={updateUrl}
        searchInput={searchInput}
        onSearchInputChange={setSearchInput}
        specializations={options.data?.specializations ?? []}
        hospitals={options.data?.hospitals ?? []}
        hasFilters={hasFilters}
        onClear={clearFilters}
      />

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

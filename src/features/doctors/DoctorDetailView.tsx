"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Building2, CalendarDays, Mail, Pencil, Phone, Plus, UserX } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import { ApiClientError, api, getErrorMessage } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { PatientFiltersBar } from "@/features/patients/PatientFiltersBar";
import { PatientFormModal } from "@/features/patients/PatientFormModal";
import { PatientListPanel } from "@/features/patients/PatientListPanel";
import { usePatientFilters, usePatientOptions } from "@/features/patients/usePatientFilters";
import type { ApiItem, ApiList, ApiMessage, Doctor, Patient } from "@/types";
import { DoctorFormModal } from "./DoctorFormModal";

const OBJECT_ID_PATTERN = /^[a-f\d]{24}$/i;

function BackLink() {
  return (
    <Link href="/doctors" className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-brand-700 hover:underline">
      <ArrowLeft className="h-4 w-4" aria-hidden="true" />
      Back to doctors
    </Link>
  );
}

export function DoctorDetailView() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const searchParams = useSearchParams();

  // id ঠিক ধরনের না হলে API-তে request-ই যায় না
  const id = searchParams.get("id") ?? "";
  const validId = OBJECT_ID_PATTERN.test(id);

  const { filters, query, updateUrl, searchInput, setSearchInput, hasFilters, clearFilters } = usePatientFilters({
    preserveKey: "id",
  });

  const doctor = useQuery({
    queryKey: ["doctors", "detail", id],
    queryFn: ({ signal }) => api.get<ApiItem<Doctor>>(`/api/doctors/${id}`, { signal }),
    select: (response) => response.data,
    enabled: validId,
  });

  const list = useQuery({
    queryKey: ["patients", "by-doctor", id, query],
    queryFn: ({ signal }) => api.get<ApiList<Patient>>(`/api/doctors/${id}/patients`, { query, signal }),
    placeholderData: keepPreviousData,
    enabled: validId,
  });
  const options = usePatientOptions(validId);

  const rows = list.data?.data ?? [];
  const pagination = list.data?.pagination;

  // বর্তমান পাতা ফাঁকা হয়ে গেলে শেষ পাতায় ফেরা
  useEffect(() => {
    if (!pagination || list.isPlaceholderData) return;
    if (rows.length === 0 && filters.page > 1 && pagination.total > 0) {
      updateUrl({ page: pagination.totalPages });
    }
  }, [pagination, rows.length, filters.page, list.isPlaceholderData, updateUrl]);

  // রোগী যোগ/edit
  const [patientForm, setPatientForm] = useState<{ open: boolean; patient: Patient | null }>({
    open: false,
    patient: null,
  });
  const openAdd = useCallback(() => setPatientForm({ open: true, patient: null }), []);
  const openEditPatient = useCallback((patient: Patient) => setPatientForm({ open: true, patient }), []);
  const closePatientForm = useCallback(() => setPatientForm((current) => ({ ...current, open: false })), []);

  // ডাক্তারের তথ্য edit
  const [doctorFormOpen, setDoctorFormOpen] = useState(false);
  const closeDoctorForm = useCallback(() => setDoctorFormOpen(false), []);

  // এই ডাক্তারের তালিকা থেকে রোগী মুছা
  const [deleting, setDeleting] = useState<Patient | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const askDelete = useCallback((patient: Patient) => {
    setDeleteError(null);
    setDeleting(patient);
  }, []);

  const deleteMutation = useMutation({
    mutationFn: (patient: Patient) => api.delete<ApiMessage>(`/api/doctors/${id}/patients/${patient._id}`),
    onSuccess: () => {
      for (const key of ["patients", "doctors", "dashboard"]) {
        void queryClient.invalidateQueries({ queryKey: [key] });
      }
      toast.success("Patient removed from this doctor's list");
      if (rows.length === 1 && filters.page > 1) updateUrl({ page: filters.page - 1 });
      setDeleting(null);
    },
    onError: (error) => setDeleteError(getErrorMessage(error)),
  });

  const cancelDelete = useCallback(() => {
    if (!deleteMutation.isPending) setDeleting(null);
  }, [deleteMutation.isPending]);

  const handlePageChange = useCallback((page: number) => updateUrl({ page }), [updateUrl]);

  // ---------- ডাক্তার পাওয়া না গেলে ----------
  const notFound = !validId || (doctor.error instanceof ApiClientError && doctor.error.status === 404);
  if (notFound) {
    return (
      <>
        <BackLink />
        <div className="rounded-xl border border-slate-200 bg-white shadow-card">
          <EmptyState
            icon={UserX}
            title="Doctor not found"
            description="This doctor does not exist or the link is incorrect."
            action={
              <Link
                href="/doctors"
                className="inline-flex h-10 items-center rounded-lg bg-brand-700 px-4 text-sm font-medium text-white hover:bg-brand-800"
              >
                Go to Doctors
              </Link>
            }
          />
        </div>
      </>
    );
  }

  const info = doctor.data;

  return (
    <>
      <BackLink />

      <PageHeader
        title={info?.name ?? "Doctor details"}
        description={info ? `${info.specialization} at ${info.hospital}` : undefined}
        actions={
          info ? (
            <>
              <Button variant="secondary" onClick={() => setDoctorFormOpen(true)}>
                <Pencil className="h-4 w-4" aria-hidden="true" />
                Edit doctor
              </Button>
              <Button onClick={openAdd}>
                <Plus className="h-4 w-4" aria-hidden="true" />
                Add patient
              </Button>
            </>
          ) : undefined
        }
      />

      {/* ডাক্তারের তথ্য */}
      <section aria-label="Doctor information" className="mb-6 rounded-xl border border-slate-200 bg-white p-5 shadow-card">
        {doctor.isError ? (
          <div role="alert" className="text-sm text-red-800">
            <p className="font-medium">Could not load this doctor.</p>
            <p className="mt-1">{getErrorMessage(doctor.error)}</p>
            <Button variant="secondary" size="sm" className="mt-3" onClick={() => void doctor.refetch()}>
              Try again
            </Button>
          </div>
        ) : !info ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-busy="true">
            {Array.from({ length: 4 }, (_, index) => (
              <Skeleton key={index} className="h-10 w-full" />
            ))}
          </div>
        ) : (
          <dl className="grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
            <div className="flex items-start gap-2.5">
              <Building2 className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
              <div className="min-w-0">
                <dt className="text-slate-500">Hospital</dt>
                <dd className="font-medium text-slate-900">{info.hospital}</dd>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <Phone className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
              <div className="min-w-0">
                <dt className="text-slate-500">Phone</dt>
                <dd className="font-medium text-slate-900">
                  <a href={`tel:${info.phone}`} className="hover:underline">
                    {info.phone}
                  </a>
                </dd>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <Mail className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
              <div className="min-w-0">
                <dt className="text-slate-500">Email</dt>
                <dd className="break-all font-medium text-slate-900">
                  <a href={`mailto:${info.email}`} className="hover:underline">
                    {info.email}
                  </a>
                </dd>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
              <div className="min-w-0">
                <dt className="text-slate-500">Added on</dt>
                <dd className="font-medium text-slate-900">{formatDate(info.createdAt)}</dd>
              </div>
            </div>
          </dl>
        )}
      </section>

      {/* এই ডাক্তারের রোগী */}
      <h2 className="mb-3 text-lg font-semibold text-slate-900">
        Patients
        {pagination && <span className="ml-2 text-sm font-normal text-slate-500">({pagination.total})</span>}
      </h2>

      <PatientFiltersBar
        filters={filters}
        updateUrl={updateUrl}
        searchInput={searchInput}
        onSearchInputChange={setSearchInput}
        conditions={options.data?.conditions ?? []}
        hasFilters={hasFilters}
        onClear={clearFilters}
      />

      <PatientListPanel
        list={list}
        showDoctor={false}
        hasFilters={hasFilters}
        onClearFilters={clearFilters}
        emptyDescription="This doctor has no patients yet. Add the first one."
        emptyAction={
          info ? (
            <Button onClick={openAdd}>
              <Plus className="h-4 w-4" aria-hidden="true" />
              Add patient
            </Button>
          ) : undefined
        }
        onEdit={openEditPatient}
        onDelete={askDelete}
        onPageChange={handlePageChange}
      />

      <PatientFormModal open={patientForm.open} patient={patientForm.patient} fixedDoctorId={id} onClose={closePatientForm} />
      <DoctorFormModal open={doctorFormOpen} doctor={info ?? null} onClose={closeDoctorForm} />

      <ConfirmDialog
        open={deleting !== null}
        title="Remove patient?"
        description={deleting ? `${deleting.name} will be permanently deleted from this doctor's list.` : ""}
        confirmLabel="Remove"
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

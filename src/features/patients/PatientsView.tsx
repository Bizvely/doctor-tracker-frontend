"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/Toast";
import { api, getErrorMessage } from "@/lib/api";
import type { ApiList, ApiMessage, Patient } from "@/types";
import { PatientFiltersBar } from "./PatientFiltersBar";
import { PatientFormModal } from "./PatientFormModal";
import { PatientListPanel } from "./PatientListPanel";
import { usePatientFilters, usePatientOptions } from "./usePatientFilters";

export function PatientsView() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const { filters, query, updateUrl, searchInput, setSearchInput, hasFilters, clearFilters } = usePatientFilters({
    withDoctor: true,
  });

  const list = useQuery({
    queryKey: ["patients", "list", query],
    queryFn: ({ signal }) => api.get<ApiList<Patient>>("/api/patients", { query, signal }),
    // পাতা বদলানোর সময় আগের তালিকা ধরে রাখে (ঝলক দেয় না)
    placeholderData: keepPreviousData,
  });
  const options = usePatientOptions();

  const rows = list.data?.data ?? [];
  const pagination = list.data?.pagination;

  // মুছে ফেলায় বা filter-এ বর্তমান পাতা ফাঁকা হয়ে গেলে শেষ পাতায় ফেরা
  useEffect(() => {
    if (!pagination || list.isPlaceholderData) return;
    if (rows.length === 0 && filters.page > 1 && pagination.total > 0) {
      updateUrl({ page: pagination.totalPages });
    }
  }, [pagination, rows.length, filters.page, list.isPlaceholderData, updateUrl]);

  // রোগী যোগ/edit ফর্ম
  const [formState, setFormState] = useState<{ open: boolean; patient: Patient | null }>({ open: false, patient: null });
  const openCreate = useCallback(() => setFormState({ open: true, patient: null }), []);
  const openEdit = useCallback((patient: Patient) => setFormState({ open: true, patient }), []);
  const closeForm = useCallback(() => setFormState((current) => ({ ...current, open: false })), []);

  // রোগী মুছা
  const [deleting, setDeleting] = useState<Patient | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const askDelete = useCallback((patient: Patient) => {
    setDeleteError(null);
    setDeleting(patient);
  }, []);

  const deleteMutation = useMutation({
    mutationFn: (patient: Patient) => api.delete<ApiMessage>(`/api/patients/${patient._id}`),
    onSuccess: () => {
      for (const key of ["patients", "doctors", "dashboard"]) {
        void queryClient.invalidateQueries({ queryKey: [key] });
      }
      toast.success("Patient deleted");
      if (rows.length === 1 && filters.page > 1) updateUrl({ page: filters.page - 1 });
      setDeleting(null);
    },
    onError: (error) => setDeleteError(getErrorMessage(error)),
  });

  const cancelDelete = useCallback(() => {
    if (!deleteMutation.isPending) setDeleting(null);
  }, [deleteMutation.isPending]);

  const handlePageChange = useCallback((page: number) => updateUrl({ page }), [updateUrl]);

  return (
    <>
      <PageHeader
        title="Patients"
        description="All patients across every doctor."
        actions={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add patient
          </Button>
        }
      />

      <PatientFiltersBar
        filters={filters}
        updateUrl={updateUrl}
        searchInput={searchInput}
        onSearchInputChange={setSearchInput}
        conditions={options.data?.conditions ?? []}
        doctors={options.data?.doctors ?? []}
        hasFilters={hasFilters}
        onClear={clearFilters}
      />

      <PatientListPanel
        list={list}
        showDoctor
        hasFilters={hasFilters}
        onClearFilters={clearFilters}
        emptyDescription="Add a patient and assign them to a doctor."
        emptyAction={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add patient
          </Button>
        }
        onEdit={openEdit}
        onDelete={askDelete}
        onPageChange={handlePageChange}
      />

      <PatientFormModal open={formState.open} patient={formState.patient} onClose={closeForm} />

      <ConfirmDialog
        open={deleting !== null}
        title="Delete patient?"
        description={deleting ? `${deleting.name} will be permanently deleted. This cannot be undone.` : ""}
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

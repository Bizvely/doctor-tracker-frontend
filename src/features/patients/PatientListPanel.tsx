"use client";

import type { UseQueryResult } from "@tanstack/react-query";
import { Pencil, Trash2, Users, XCircle } from "lucide-react";
import Link from "next/link";
import { memo, type ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Pagination } from "@/components/ui/Pagination";
import { Skeleton } from "@/components/ui/Skeleton";
import { Table, TBody, Td, Th, THead, Tr } from "@/components/ui/Table";
import { getErrorMessage } from "@/lib/api";
import { cn } from "@/lib/cn";
import { formatDateOnly } from "@/lib/format";
import type { ApiList, Gender, Patient } from "@/types";

const GENDER_LABEL: Record<Gender, string> = { male: "Male", female: "Female", other: "Other" };
const BADGE = "inline-flex rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-medium text-brand-800";
const ICON_BUTTON =
  "inline-flex h-8 w-8 items-center justify-center rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600";

function ageAndGender(patient: Patient): string {
  return patient.gender ? `${patient.age} · ${GENDER_LABEL[patient.gender]}` : String(patient.age);
}

interface RowProps {
  patient: Patient;
  showDoctor: boolean;
  onEdit: (patient: Patient) => void;
  onDelete: (patient: Patient) => void;
}

function RowActions({ patient, onEdit, onDelete }: Pick<RowProps, "patient" | "onEdit" | "onDelete">) {
  return (
    <div className="flex justify-end gap-1">
      <button
        type="button"
        onClick={() => onEdit(patient)}
        aria-label={`Edit ${patient.name}`}
        title="Edit"
        className={cn(ICON_BUTTON, "text-slate-600 hover:bg-slate-100")}
      >
        <Pencil className="h-4 w-4" aria-hidden="true" />
      </button>
      <button
        type="button"
        onClick={() => onDelete(patient)}
        aria-label={`Delete ${patient.name}`}
        title="Delete"
        className={cn(ICON_BUTTON, "text-red-700 hover:bg-red-50")}
      >
        <Trash2 className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
}

function DoctorLink({ patient }: { patient: Patient }) {
  if (!patient.doctor) return <span className="text-slate-500">-</span>;
  return (
    <>
      <Link href={`/doctors/view?id=${patient.doctor._id}`} className="font-medium text-brand-700 hover:underline">
        {patient.doctor.name}
      </Link>
      <p className="text-xs text-slate-500">{patient.doctor.specialization}</p>
    </>
  );
}

// memo: বাকি তালিকা না বদলালে সারি আবার আঁকা হয় না
const PatientRow = memo(function PatientRow({ patient, showDoctor, onEdit, onDelete }: RowProps) {
  return (
    <Tr>
      <Td>
        <p className="font-medium text-slate-900">{patient.name}</p>
        <a href={`tel:${patient.phone}`} className="text-xs text-slate-500 hover:underline">
          {patient.phone}
        </a>
        {patient.notes && (
          <p className="mt-0.5 max-w-xs truncate text-xs text-slate-500" title={patient.notes}>
            {patient.notes}
          </p>
        )}
      </Td>
      <Td className="whitespace-nowrap">{ageAndGender(patient)}</Td>
      <Td>
        <span className={BADGE}>{patient.condition}</span>
      </Td>
      <Td className="whitespace-nowrap">{formatDateOnly(patient.visitDate)}</Td>
      {showDoctor && (
        <Td>
          <DoctorLink patient={patient} />
        </Td>
      )}
      <Td>
        <RowActions patient={patient} onEdit={onEdit} onDelete={onDelete} />
      </Td>
    </Tr>
  );
});

// মোবাইলে টেবিলের বদলে কার্ড
const PatientCard = memo(function PatientCard({ patient, showDoctor, onEdit, onDelete }: RowProps) {
  return (
    <li className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-medium text-slate-900">{patient.name}</p>
          <span className={cn(BADGE, "mt-1")}>{patient.condition}</span>
        </div>
        <RowActions patient={patient} onEdit={onEdit} onDelete={onDelete} />
      </div>
      <dl className="mt-3 space-y-1 text-sm text-slate-600">
        <div className="flex gap-2">
          <dt className="w-20 shrink-0 text-slate-500">Age</dt>
          <dd>{ageAndGender(patient)}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="w-20 shrink-0 text-slate-500">Phone</dt>
          <dd>
            <a href={`tel:${patient.phone}`} className="hover:underline">
              {patient.phone}
            </a>
          </dd>
        </div>
        <div className="flex gap-2">
          <dt className="w-20 shrink-0 text-slate-500">Visit</dt>
          <dd>{formatDateOnly(patient.visitDate)}</dd>
        </div>
        {showDoctor && (
          <div className="flex gap-2">
            <dt className="w-20 shrink-0 text-slate-500">Doctor</dt>
            <dd className="min-w-0">
              <DoctorLink patient={patient} />
            </dd>
          </div>
        )}
        {patient.notes && (
          <div className="flex gap-2">
            <dt className="w-20 shrink-0 text-slate-500">Notes</dt>
            <dd className="min-w-0 break-words">{patient.notes}</dd>
          </div>
        )}
      </dl>
    </li>
  );
});

interface PatientListPanelProps {
  list: UseQueryResult<ApiList<Patient>, Error>;
  showDoctor: boolean;
  hasFilters: boolean;
  onClearFilters: () => void;
  // তালিকা সত্যিই ফাঁকা থাকলে যে বাটন দেখাবে (যেমন "Add patient")
  emptyAction?: ReactNode;
  emptyDescription: string;
  onEdit: (patient: Patient) => void;
  onDelete: (patient: Patient) => void;
  onPageChange: (page: number) => void;
}

export function PatientListPanel({
  list,
  showDoctor,
  hasFilters,
  onClearFilters,
  emptyAction,
  emptyDescription,
  onEdit,
  onDelete,
  onPageChange,
}: PatientListPanelProps) {
  const rows = list.data?.data ?? [];
  const pagination = list.data?.pagination;

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-card">
      {list.isPending ? (
        <div className="space-y-3 p-4" aria-busy="true">
          {Array.from({ length: 5 }, (_, index) => (
            <Skeleton key={index} className="h-12 w-full" />
          ))}
          <p className="text-sm text-slate-500">Loading patients. The free server can take up to a minute to wake up.</p>
        </div>
      ) : list.isError && !list.data ? (
        <div role="alert" className="flex items-start gap-3 p-5 text-sm text-red-800">
          <XCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
          <div>
            <p className="font-medium">Could not load patients.</p>
            <p className="mt-1">{getErrorMessage(list.error)}</p>
            <div className="mt-3 flex gap-2">
              <Button variant="secondary" size="sm" onClick={() => void list.refetch()}>
                Try again
              </Button>
              {hasFilters && (
                <Button variant="ghost" size="sm" onClick={onClearFilters}>
                  Clear filters
                </Button>
              )}
            </div>
          </div>
        </div>
      ) : rows.length === 0 ? (
        hasFilters ? (
          <EmptyState
            icon={Users}
            title="No patients match your filters"
            description="Try a different search or clear the filters."
            action={
              <Button variant="secondary" onClick={onClearFilters}>
                Clear filters
              </Button>
            }
          />
        ) : (
          <EmptyState icon={Users} title="No patients yet" description={emptyDescription} action={emptyAction} />
        )
      ) : (
        <div aria-busy={list.isPlaceholderData} className={cn(list.isPlaceholderData && "opacity-60 transition-opacity")}>
          <div className="hidden md:block">
            <Table>
              <THead>
                <Tr>
                  <Th>Patient</Th>
                  <Th>Age / Gender</Th>
                  <Th>Condition</Th>
                  <Th>Visit date</Th>
                  {showDoctor && <Th>Doctor</Th>}
                  <Th className="text-right">Actions</Th>
                </Tr>
              </THead>
              <TBody>
                {rows.map((patient) => (
                  <PatientRow key={patient._id} patient={patient} showDoctor={showDoctor} onEdit={onEdit} onDelete={onDelete} />
                ))}
              </TBody>
            </Table>
          </div>

          <ul className="divide-y divide-slate-100 md:hidden">
            {rows.map((patient) => (
              <PatientCard key={patient._id} patient={patient} showDoctor={showDoctor} onEdit={onEdit} onDelete={onDelete} />
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
          onPageChange={onPageChange}
        />
      )}
    </div>
  );
}

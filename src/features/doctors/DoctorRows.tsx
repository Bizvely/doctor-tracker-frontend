"use client";

import { Eye, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { memo } from "react";
import { Td, Tr } from "@/components/ui/Table";
import { cn } from "@/lib/cn";
import { formatDate } from "@/lib/format";
import type { Doctor } from "@/types";

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
export const DoctorRow = memo(function DoctorRow({ doctor, onEdit, onDelete }: RowProps) {
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
export const DoctorCard = memo(function DoctorCard({ doctor, onEdit, onDelete }: RowProps) {
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

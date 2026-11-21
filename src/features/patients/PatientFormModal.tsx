"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { useToast } from "@/components/ui/Toast";
import { api, getErrorMessage } from "@/lib/api";
import type { ApiItem, Patient } from "@/types";
import { usePatientOptions } from "./usePatientFilters";

// ফর্মের নিয়ম (backend-এর নিয়মের সাথে মেলানো; রোগের তালিকার আসল যাচাই backend-ই করে)
const patientFormSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(80, "Name is too long"),
  age: z
    .number({ invalid_type_error: "Enter the age" })
    .int("Age must be a whole number")
    .min(0, "Age cannot be negative")
    .max(120, "Age must be 120 or less"),
  gender: z.string(),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[0-9][0-9\s-]{5,18}$/, "Enter a valid phone number, e.g. +1 555 010 2030"),
  condition: z.string().min(1, "Select a condition"),
  visitDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a visit date"),
  notes: z.string().trim().max(500, "Notes can be at most 500 characters"),
  doctorId: z.string(),
});

type PatientFormValues = z.infer<typeof patientFormSchema>;

// age খালি রাখা হয়েছে, যাতে ফর্মে ০ না দেখায়
const EMPTY_VALUES = { name: "", gender: "", phone: "", condition: "", visitDate: "", notes: "", doctorId: "" };

// ব্যবহারকারীর নিজের তারিখ, "2026-11-21" ধরনে
function todayString(): string {
  return new Date().toLocaleDateString("en-CA");
}

interface PatientFormModalProps {
  open: boolean;
  // null হলে নতুন রোগী, না হলে সেই রোগীকে edit
  patient: Patient | null;
  // ডাক্তারের পাতা থেকে খুললে সেই ডাক্তারের id
  fixedDoctorId?: string;
  onClose: () => void;
}

export function PatientFormModal({ open, patient, fixedDoctorId, onClose }: PatientFormModalProps) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [formError, setFormError] = useState<string | null>(null);
  const isEdit = patient !== null;
  const options = usePatientOptions(open);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<PatientFormValues>({
    resolver: zodResolver(patientFormSchema),
    defaultValues: EMPTY_VALUES,
  });

  // বাক্স খুললে ফর্ম নতুন করে সাজানো
  useEffect(() => {
    if (!open) return;
    setFormError(null);
    reset(
      patient
        ? {
            name: patient.name,
            age: patient.age,
            gender: patient.gender ?? "",
            phone: patient.phone,
            condition: patient.condition,
            visitDate: patient.visitDate.slice(0, 10),
            notes: patient.notes ?? "",
            doctorId: patient.doctor?._id ?? fixedDoctorId ?? "",
          }
        : { ...EMPTY_VALUES, visitDate: todayString(), doctorId: fixedDoctorId ?? "" }
    );
  }, [open, patient, fixedDoctorId, reset]);

  const mutation = useMutation({
    mutationFn: (values: PatientFormValues) => {
      // backend strict: ডাক্তারের পাতার POST-এ doctorId পাঠানো যায় না
      const { doctorId, ...fields } = values;
      if (patient) {
        return api.put<ApiItem<Patient>>(`/api/patients/${patient._id}`, { ...fields, doctorId: fixedDoctorId ?? doctorId });
      }
      if (fixedDoctorId) {
        return api.post<ApiItem<Patient>>(`/api/doctors/${fixedDoctorId}/patients`, fields);
      }
      return api.post<ApiItem<Patient>>("/api/patients", { ...fields, doctorId });
    },
    onSuccess: () => {
      // রোগীর তালিকা, ডাক্তারের রোগী সংখ্যা ও Dashboard-এর পুরোনো data বাতিল
      for (const key of ["patients", "doctors", "dashboard"]) {
        void queryClient.invalidateQueries({ queryKey: [key] });
      }
      toast.success(isEdit ? "Patient updated" : "Patient added");
      onClose();
    },
    onError: (error) => setFormError(getErrorMessage(error)),
  });

  const onSubmit = (values: PatientFormValues): void => {
    setFormError(null);
    if (!fixedDoctorId && !values.doctorId) {
      setError("doctorId", { message: "Select a doctor" });
      return;
    }
    mutation.mutate(values);
  };

  const conditions = options.data?.conditions ?? [];
  const doctors = options.data?.doctors ?? [];

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "Edit patient" : "Add patient"}
      description={isEdit ? "Update the patient's details." : "Record a new patient and their visit."}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="patient-form" loading={mutation.isPending}>
            {isEdit ? "Save changes" : "Add patient"}
          </Button>
        </>
      }
    >
      <form id="patient-form" noValidate onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {formError && (
          <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
            {formError}
          </p>
        )}

        {!fixedDoctorId && (
          <Select label="Doctor" error={errors.doctorId?.message} {...register("doctorId")}>
            <option value="">{options.isPending ? "Loading doctors..." : "Select a doctor"}</option>
            {doctors.map((doctor) => (
              <option key={doctor._id} value={doctor._id}>
                {doctor.name} ({doctor.specialization})
              </option>
            ))}
          </Select>
        )}

        <Input label="Full name" placeholder="Michael Brown" autoComplete="off" error={errors.name?.message} {...register("name")} />

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Age"
            type="number"
            inputMode="numeric"
            min={0}
            max={120}
            placeholder="35"
            error={errors.age?.message}
            {...register("age", { valueAsNumber: true })}
          />
          <Select label="Gender (optional)" error={errors.gender?.message} {...register("gender")}>
            <option value="">Not specified</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </Select>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Phone"
            type="tel"
            placeholder="+1 555 010 2030"
            autoComplete="off"
            error={errors.phone?.message}
            {...register("phone")}
          />
          <Input
            label="Visit date"
            type="date"
            min="2000-01-01"
            max="2100-12-31"
            error={errors.visitDate?.message}
            {...register("visitDate")}
          />
        </div>

        <Select label="Condition" error={errors.condition?.message} {...register("condition")}>
          <option value="">{options.isPending ? "Loading conditions..." : "Select a condition"}</option>
          {conditions.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </Select>

        <div>
          <label htmlFor="patient-notes" className="mb-1.5 block text-sm font-medium text-slate-700">
            Notes (optional)
          </label>
          <textarea
            id="patient-notes"
            rows={3}
            maxLength={500}
            aria-invalid={errors.notes ? true : undefined}
            aria-describedby={errors.notes ? "patient-notes-error" : undefined}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-200"
            placeholder="Any helpful details about the visit"
            {...register("notes")}
          />
          {errors.notes && (
            <p id="patient-notes-error" className="mt-1.5 text-sm text-red-700">
              {errors.notes.message}
            </p>
          )}
        </div>
      </form>
    </Modal>
  );
}

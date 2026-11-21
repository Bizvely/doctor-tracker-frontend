"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { api, getErrorMessage } from "@/lib/api";
import type { ApiItem, Doctor } from "@/types";

// ফর্মের নিয়ম (backend-এর নিয়মের সাথে মেলানো; আসল যাচাই backend-ই করে)
const doctorFormSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(80, "Name is too long"),
  specialization: z.string().trim().min(2, "Enter a specialization").max(80, "Specialization is too long"),
  hospital: z.string().trim().min(2, "Enter a hospital").max(120, "Hospital name is too long"),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[0-9][0-9\s-]{5,18}$/, "Enter a valid phone number, e.g. +1 555 010 2030"),
  email: z.string().trim().min(1, "Enter an email address").email("Enter a valid email address").max(120),
});

type DoctorFormValues = z.infer<typeof doctorFormSchema>;

const EMPTY_VALUES: DoctorFormValues = { name: "", specialization: "", hospital: "", phone: "", email: "" };

interface DoctorFormModalProps {
  open: boolean;
  // null হলে নতুন ডাক্তার যোগ, না হলে সেই ডাক্তারকে edit
  doctor: Doctor | null;
  onClose: () => void;
}

export function DoctorFormModal({ open, doctor, onClose }: DoctorFormModalProps) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [formError, setFormError] = useState<string | null>(null);
  const isEdit = doctor !== null;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<DoctorFormValues>({
    resolver: zodResolver(doctorFormSchema),
    defaultValues: EMPTY_VALUES,
  });

  // বাক্স খুললে ফর্ম নতুন করে সাজানো (edit হলে আগের তথ্য বসানো)
  useEffect(() => {
    if (!open) return;
    setFormError(null);
    reset(
      doctor
        ? {
            name: doctor.name,
            specialization: doctor.specialization,
            hospital: doctor.hospital,
            phone: doctor.phone,
            email: doctor.email,
          }
        : EMPTY_VALUES
    );
  }, [open, doctor, reset]);

  const mutation = useMutation({
    mutationFn: (values: DoctorFormValues) =>
      doctor
        ? api.put<ApiItem<Doctor>>(`/api/doctors/${doctor._id}`, values)
        : api.post<ApiItem<Doctor>>("/api/doctors", values),
    onSuccess: () => {
      // তালিকা, filter-এর তালিকা, Dashboard ও Patients-এর পুরোনো data বাতিল করে নতুন আনা
      for (const key of ["doctors", "dashboard", "patients"]) {
        void queryClient.invalidateQueries({ queryKey: [key] });
      }
      toast.success(isEdit ? "Doctor updated" : "Doctor added");
      onClose();
    },
    onError: (error) => setFormError(getErrorMessage(error)),
  });

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "Edit doctor" : "Add doctor"}
      description={isEdit ? "Update the doctor's details." : "Add a new doctor to the directory."}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          {/* বাটনটা Modal-এর footer-এ, তাই form="doctor-form" দিয়ে ফর্মের সাথে জোড়া */}
          <Button type="submit" form="doctor-form" loading={mutation.isPending}>
            {isEdit ? "Save changes" : "Add doctor"}
          </Button>
        </>
      }
    >
      <form
        id="doctor-form"
        noValidate
        onSubmit={handleSubmit((values) => {
          setFormError(null);
          mutation.mutate(values);
        })}
        className="space-y-4"
      >
        {formError && (
          <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
            {formError}
          </p>
        )}

        <Input label="Full name" placeholder="Dr. Sarah Johnson" autoComplete="off" error={errors.name?.message} {...register("name")} />

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Specialization"
            placeholder="Cardiology"
            autoComplete="off"
            error={errors.specialization?.message}
            {...register("specialization")}
          />
          <Input
            label="Hospital"
            placeholder="City General Hospital"
            autoComplete="off"
            error={errors.hospital?.message}
            {...register("hospital")}
          />
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
            label="Email"
            type="email"
            placeholder="doctor@example.com"
            autoComplete="off"
            error={errors.email?.message}
            {...register("email")}
          />
        </div>
      </form>
    </Modal>
  );
}

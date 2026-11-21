"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";
import { api, getErrorMessage } from "@/lib/api";
import type { ApiMessage } from "@/types";

// ফর্মের নিয়ম (backend-এর নিয়মের সাথে মেলানো: নতুন password ১২–৭২ অক্ষর)
const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password").max(128),
    newPassword: z.string().min(12, "Use at least 12 characters").max(72, "Use at most 72 characters"),
    confirmPassword: z.string().min(1, "Confirm your new password"),
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })
  .refine((values) => values.newPassword !== values.currentPassword, {
    message: "New password must be different from the current one",
    path: ["newPassword"],
  });

type PasswordForm = z.infer<typeof passwordSchema>;

export function ChangePasswordForm() {
  const toast = useToast();
  const [formError, setFormError] = useState<string | null>(null);
  const [showPasswords, setShowPasswords] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });

  const onSubmit = async (values: PasswordForm): Promise<void> => {
    setFormError(null);
    try {
      await api.post<ApiMessage>("/api/auth/change-password", {
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      reset();
      toast.success("Password changed");
    } catch (error) {
      setFormError(getErrorMessage(error));
    }
  };

  const inputType = showPasswords ? "text" : "password";

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-4 space-y-4">
      {formError && (
        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {formError}
        </p>
      )}

      <Input
        label="Current password"
        type={inputType}
        autoComplete="current-password"
        error={errors.currentPassword?.message}
        {...register("currentPassword")}
      />
      <Input
        label="New password"
        type={inputType}
        autoComplete="new-password"
        hint="At least 12 characters."
        error={errors.newPassword?.message}
        {...register("newPassword")}
      />
      <Input
        label="Confirm new password"
        type={inputType}
        autoComplete="new-password"
        error={errors.confirmPassword?.message}
        {...register("confirmPassword")}
      />

      <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-600">
        <input
          type="checkbox"
          checked={showPasswords}
          onChange={(event) => setShowPasswords(event.target.checked)}
          className="h-4 w-4 rounded border-slate-300"
        />
        Show passwords
      </label>

      <Button type="submit" loading={isSubmitting}>
        Update password
      </Button>
    </form>
  );
}

"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { HeartPulse } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { FullPageLoader } from "@/components/auth/AuthGuard";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { getErrorMessage } from "@/lib/api";
import { useAuth } from "@/providers/AuthProvider";

// ফর্মের নিয়ম (backend-এর নিয়মের সাথে মেলানো)
const loginSchema = z.object({
  email: z.string().trim().min(1, "Enter your email").email("Enter a valid email address").max(120),
  password: z.string().min(1, "Enter your password").max(128),
});

type LoginForm = z.infer<typeof loginSchema>;

export function LoginView() {
  const { status, login } = useAuth();
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  // আগে থেকেই login থাকলে সরাসরি Dashboard-এ
  useEffect(() => {
    if (status === "authenticated") router.replace("/dashboard");
  }, [status, router]);

  const onSubmit = async (values: LoginForm): Promise<void> => {
    setFormError(null);
    try {
      await login(values.email, values.password);
      // সফল হলে status বদলায়, উপরের useEffect নিজেই Dashboard-এ নেবে
    } catch (error) {
      setFormError(getErrorMessage(error));
    }
  };

  if (status !== "unauthenticated") return <FullPageLoader />;

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-700 text-white">
            <HeartPulse className="h-6 w-6" aria-hidden="true" />
          </span>
          <h1 className="text-xl font-semibold text-slate-900">Doctor Tracker</h1>
          <p className="mt-1 text-sm text-slate-500">Sign in to the admin portal</p>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          {formError && (
            <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
              {formError}
            </p>
          )}

          <Input
            label="Email"
            type="email"
            autoComplete="email"
            placeholder="admin@example.com"
            error={errors.email?.message}
            {...register("email")}
          />

          <div>
            <Input
              label="Password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              error={errors.password?.message}
              {...register("password")}
            />
            <label className="mt-2 flex cursor-pointer items-center gap-2 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={showPassword}
                onChange={(event) => setShowPassword(event.target.checked)}
                className="h-4 w-4 rounded border-slate-300"
              />
              Show password
            </label>
          </div>

          <Button type="submit" loading={isSubmitting} className="w-full">
            Sign in
          </Button>
        </form>

        <p className="mt-4 text-center text-xs text-slate-500">Authorized staff only.</p>
      </div>
    </main>
  );
}

"use client";

import { PageHeader } from "@/components/layout/PageHeader";
import { useAuth } from "@/providers/AuthProvider";
import { ChangePasswordForm } from "./ChangePasswordForm";
import { DemoDataCard } from "./DemoDataCard";

// Settings পাতা: অ্যাকাউন্ট (password বদল) ও Demo data on/off
export function SettingsView() {
  const { user } = useAuth();

  return (
    <>
      <PageHeader title="Settings" description="Manage your account and demo data." />

      <div className="max-w-2xl space-y-6">
        <section aria-labelledby="account-heading" className="rounded-xl border border-slate-200 bg-white p-5 shadow-card">
          <h2 id="account-heading" className="text-base font-semibold text-slate-900">
            Account
          </h2>
          <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-slate-500">Name</dt>
              <dd className="mt-0.5 font-medium text-slate-900">{user?.name}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Email</dt>
              <dd className="mt-0.5 break-all font-medium text-slate-900">{user?.email}</dd>
            </div>
          </dl>

          <div className="mt-5 border-t border-slate-200 pt-5">
            <h3 className="text-sm font-semibold text-slate-900">Change password</h3>
            <p className="mt-1 text-sm text-slate-500">
              Other devices will be signed out after you change it.
            </p>
            <ChangePasswordForm />
          </div>
        </section>

        <DemoDataCard />
      </div>
    </>
  );
}

import type { ReactNode } from "react";
import { AppShell } from "@/components/layout/AppShell";

// Dashboard / Doctors / Patients সব পাতা এই কাঠামোর (sidebar + topbar) ভেতরে থাকে
export default function AppLayout({ children }: { children: ReactNode }) {
  return <AppShell>{children}</AppShell>;
}

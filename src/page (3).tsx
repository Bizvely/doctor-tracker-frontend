import type { Metadata } from "next";
import { DashboardView } from "@/features/dashboard/DashboardView";

// পাতার title browser tab-এ দেখায় ("Dashboard | Doctor Tracker")
export const metadata: Metadata = { title: "Dashboard" };

export default function DashboardPage() {
  return <DashboardView />;
}

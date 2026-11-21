import type { Metadata } from "next";
import { LoginView } from "@/features/auth/LoginView";

// Browser tab-এ "Admin Login | Doctor Tracker" দেখাবে
export const metadata: Metadata = { title: "Admin Login" };

export default function AdminLoginPage() {
  return <LoginView />;
}

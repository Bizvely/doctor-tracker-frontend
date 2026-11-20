import type { Metadata } from "next";
import { PatientsView } from "@/features/patients/PatientsView";

// পাতার title browser tab-এ দেখায় ("Patients | Doctor Tracker")
export const metadata: Metadata = { title: "Patients" };

export default function PatientsPage() {
  return <PatientsView />;
}

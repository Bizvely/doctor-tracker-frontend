import type { Metadata } from "next";
import { DoctorsView } from "@/features/doctors/DoctorsView";

// পাতার title browser tab-এ দেখায় ("Doctors | Doctor Tracker")
export const metadata: Metadata = { title: "Doctors" };

export default function DoctorsPage() {
  return <DoctorsView />;
}

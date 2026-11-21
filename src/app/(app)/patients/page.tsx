import type { Metadata } from "next";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/Skeleton";
import { PatientsView } from "@/features/patients/PatientsView";

export const metadata: Metadata = { title: "Patients" };

export default function PatientsPage() {
  // useSearchParams (URL-এর ?search=...) ব্যবহার করা পাতায় Suspense বাধ্যতামূলক (static export)
  return (
    <Suspense fallback={<Skeleton className="h-96 w-full" />}>
      <PatientsView />
    </Suspense>
  );
}

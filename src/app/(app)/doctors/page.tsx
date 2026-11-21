import type { Metadata } from "next";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/Skeleton";
import { DoctorsView } from "@/features/doctors/DoctorsView";

export const metadata: Metadata = { title: "Doctors" };

export default function DoctorsPage() {
  // useSearchParams (URL-এর ?search=...) ব্যবহার করা পাতায় Suspense বাধ্যতামূলক (static export)
  return (
    <Suspense fallback={<Skeleton className="h-96 w-full" />}>
      <DoctorsView />
    </Suspense>
  );
}

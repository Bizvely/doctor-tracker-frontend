import type { Metadata } from "next";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/Skeleton";
import { DoctorDetailView } from "@/features/doctors/DoctorDetailView";

export const metadata: Metadata = { title: "Doctor details" };

export default function DoctorDetailPage() {
  // ডাক্তারের id আসে URL-এর ?id=... থেকে, তাই Suspense বাধ্যতামূলক (static export)
  return (
    <Suspense fallback={<Skeleton className="h-96 w-full" />}>
      <DoctorDetailView />
    </Suspense>
  );
}

"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Database } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { api, getErrorMessage } from "@/lib/api";
import type { ApiMessage } from "@/types";

// ফাঁকা database-এ নমুনা ডাক্তার ও রোগী তৈরি (backend শুধু ফাঁকা থাকলেই অনুমতি দেয়)
export function LoadDemoDataButton() {
  const queryClient = useQueryClient();
  const toast = useToast();

  const mutation = useMutation({
    mutationFn: () => api.post<ApiMessage>("/api/dashboard/demo-data"),
    onSuccess: () => {
      for (const key of ["dashboard", "doctors", "patients"]) {
        void queryClient.invalidateQueries({ queryKey: [key] });
      }
      toast.success("Demo data loaded");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  return (
    <Button variant="secondary" loading={mutation.isPending} onClick={() => mutation.mutate()}>
      {!mutation.isPending && <Database className="h-4 w-4" aria-hidden="true" />}
      Load demo data
    </Button>
  );
}

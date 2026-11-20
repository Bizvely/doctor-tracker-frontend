"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { memo } from "react";
import { cn } from "@/lib/cn";

interface PaginationProps {
  page: number;
  totalPages: number;
  total: number;
  limit: number;
  onPageChange: (page: number) => void;
}

type PageItem = number | "ellipsis-left" | "ellipsis-right";

// ১ ... 4 5 6 ... 20 ধরনের তালিকা বানানো
function getPageItems(page: number, totalPages: number): PageItem[] {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, index) => index + 1);

  const items: PageItem[] = [1];
  const start = Math.max(2, page - 1);
  const end = Math.min(totalPages - 1, page + 1);

  if (start > 2) items.push("ellipsis-left");
  for (let current = start; current <= end; current += 1) items.push(current);
  if (end < totalPages - 1) items.push("ellipsis-right");
  items.push(totalPages);

  return items;
}

const buttonBase =
  "inline-flex h-9 min-w-9 items-center justify-center rounded-lg border px-2 text-sm font-medium transition-colors " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 disabled:cursor-not-allowed disabled:opacity-50";

// memo: page/total একই থাকলে আবার আঁকা হয় না
export const Pagination = memo(function Pagination({ page, totalPages, total, limit, onPageChange }: PaginationProps) {
  if (total === 0) return null;

  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  return (
    <nav aria-label="Pagination" className="flex flex-col items-center justify-between gap-3 border-t border-slate-200 px-4 py-3 sm:flex-row">
      <p className="text-sm text-slate-500">
        Showing <span className="font-medium text-slate-700">{from}</span>-<span className="font-medium text-slate-700">{to}</span> of{" "}
        <span className="font-medium text-slate-700">{total}</span>
      </p>

      <div className="flex items-center gap-1.5">
        <button
          type="button"
          className={cn(buttonBase, "border-slate-300 bg-white text-slate-700 hover:bg-slate-50")}
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        </button>

        {/* ছোট পর্দায় শুধু "Page x of y", বড় পর্দায় নম্বরগুলো */}
        <span className="px-2 text-sm text-slate-600 sm:hidden">
          Page {page} of {totalPages}
        </span>
        <div className="hidden items-center gap-1.5 sm:flex">
          {getPageItems(page, totalPages).map((item) =>
            typeof item === "string" ? (
              <span key={item} className="px-1 text-slate-400" aria-hidden="true">
                ...
              </span>
            ) : (
              <button
                key={item}
                type="button"
                onClick={() => onPageChange(item)}
                aria-label={`Page ${item}`}
                aria-current={item === page ? "page" : undefined}
                className={cn(
                  buttonBase,
                  item === page
                    ? "border-brand-700 bg-brand-700 text-white"
                    : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                )}
              >
                {item}
              </button>
            )
          )}
        </div>

        <button
          type="button"
          className={cn(buttonBase, "border-slate-300 bg-white text-slate-700 hover:bg-slate-50")}
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          aria-label="Next page"
        >
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </nav>
  );
});

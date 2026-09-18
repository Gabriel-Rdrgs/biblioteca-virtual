import { BookGridSkeleton } from "@/components/ui/primitives";

export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="bg-surface-sunken h-4 w-40 animate-pulse rounded" />
      <div className="bg-surface-sunken mt-6 h-9 w-72 animate-pulse rounded" />
      <div className="bg-surface-sunken mt-3 h-4 w-full max-w-2xl animate-pulse rounded" />
      <div className="mt-10">
        <BookGridSkeleton />
      </div>
    </div>
  );
}

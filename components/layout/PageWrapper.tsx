"use client";

import { Skeleton } from "@/components/ui/skeleton";

interface PageWrapperProps {
  children: React.ReactNode;
  isLoading?: boolean;
}

export function PageWrapper({ children, isLoading }: PageWrapperProps) {
  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

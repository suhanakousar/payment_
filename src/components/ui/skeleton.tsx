import * as React from "react";
import { cn } from "@/lib/utils";

// ─── Base Skeleton ────────────────────────────────────────────────────────────

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Shorthand for making the skeleton a circle */
  circle?: boolean;
  width?: string | number;
  height?: string | number;
}

function Skeleton({ className, circle, width, height, style, ...props }: SkeletonProps) {
  return (
    <div
      className={cn("skeleton rounded-md", circle && "rounded-full", className)}
      style={{
        width,
        height,
        ...style,
      }}
      aria-hidden="true"
      {...props}
    />
  );
}

// ─── Preset Skeletons ─────────────────────────────────────────────────────────

/** Single text line skeleton */
function SkeletonText({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <Skeleton className={cn("h-4 w-full rounded", className)} {...props} />;
}

/** Avatar / icon placeholder */
function SkeletonAvatar({ size = 40, className, ...props }: SkeletonProps & { size?: number }) {
  return (
    <Skeleton
      circle
      width={size}
      height={size}
      className={cn("shrink-0", className)}
      {...props}
    />
  );
}

/** Stat card skeleton matching the StatCard layout */
function SkeletonStatCard({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-xl bg-white border border-slate-100 p-6 flex flex-col gap-4",
        "shadow-[var(--shadow-sm)]",
        className
      )}
      aria-hidden="true"
      {...props}
    >
      {/* Top row: icon + label */}
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-2 flex-1">
          <Skeleton className="h-3.5 w-24 rounded" />
          <Skeleton className="h-8 w-32 rounded-md" />
        </div>
        <Skeleton circle width={44} height={44} />
      </div>
      {/* Change row */}
      <Skeleton className="h-3.5 w-36 rounded" />
    </div>
  );
}

/** Table row skeleton */
function SkeletonTableRow({
  cols = 5,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { cols?: number }) {
  return (
    <div
      className={cn("flex items-center gap-4 py-3 px-4", className)}
      aria-hidden="true"
      {...props}
    >
      {Array.from({ length: cols }).map((_, i) => (
        <Skeleton
          key={i}
          className="h-4 flex-1 rounded"
          style={{ opacity: 1 - i * 0.07 }}
        />
      ))}
    </div>
  );
}

export { Skeleton, SkeletonText, SkeletonAvatar, SkeletonStatCard, SkeletonTableRow };

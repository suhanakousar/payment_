"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Size map ─────────────────────────────────────────────────────────────────
const sizeClasses = {
  sm: "max-w-sm",
  md: "max-w-lg",
  lg: "max-w-2xl",
} as const;

// ─── Sub-components ───────────────────────────────────────────────────────────

export interface ModalHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  onClose?: () => void;
}

export const ModalHeader = React.forwardRef<HTMLDivElement, ModalHeaderProps>(
  ({ className, children, onClose, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "flex items-start justify-between px-6 pt-6 pb-4 border-b border-slate-100",
        className
      )}
      {...props}
    >
      <div className="flex-1 pr-4">{children}</div>
      {onClose && (
        <button
          onClick={onClose}
          aria-label="Close modal"
          className={cn(
            "shrink-0 rounded-lg p-1.5 text-slate-400",
            "hover:bg-slate-100 hover:text-slate-600",
            "transition-colors duration-150",
            "focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
          )}
        >
          <X size={18} />
        </button>
      )}
    </div>
  )
);
ModalHeader.displayName = "ModalHeader";

export const ModalTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h2
    ref={ref}
    className={cn("text-lg font-semibold text-slate-900 leading-snug", className)}
    {...props}
  />
));
ModalTitle.displayName = "ModalTitle";

export const ModalDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-slate-500 mt-1 leading-relaxed", className)}
    {...props}
  />
));
ModalDescription.displayName = "ModalDescription";

export const ModalBody = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("px-6 py-5", className)} {...props} />
));
ModalBody.displayName = "ModalBody";

export const ModalFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex items-center justify-end gap-3 px-6 pb-6 pt-4 border-t border-slate-100",
      className
    )}
    {...props}
  />
));
ModalFooter.displayName = "ModalFooter";

// ─── Main Modal ───────────────────────────────────────────────────────────────

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  size?: keyof typeof sizeClasses;
  className?: string;
  /** Clicking backdrop closes the modal (default: true) */
  closeOnBackdrop?: boolean;
  children: React.ReactNode;
}

export function Modal({
  open,
  onClose,
  size = "md",
  className,
  closeOnBackdrop = true,
  children,
}: ModalProps) {
  // Close on Escape key
  React.useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  // Prevent body scroll when open
  React.useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm"
            onClick={closeOnBackdrop ? onClose : undefined}
            aria-hidden="true"
          />

          {/* Panel */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              key="modal-panel"
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className={cn(
                "pointer-events-auto w-full rounded-2xl bg-white",
                "shadow-[0_24px_48px_-8px_rgba(0,0,0,0.15),0_8px_16px_-4px_rgba(0,0,0,0.08)]",
                sizeClasses[size],
                className
              )}
              role="dialog"
              aria-modal="true"
              onClick={(e) => e.stopPropagation()}
            >
              {children}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

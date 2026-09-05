import * as React from "react"
import { cva } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium transition-colors select-none",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground shadow-none",
        secondary:
          "border-transparent bg-slate-100 text-slate-700",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground",
        outline: "border-slate-200 bg-white text-slate-700",
        success:
          "border-emerald-200/80 bg-emerald-50 text-emerald-700",
        warning:
          "border-amber-200/80 bg-amber-50 text-amber-800",
        danger:
          "border-red-200/80 bg-red-50 text-red-700",
        info:
          "border-sky-200/80 bg-sky-50 text-sky-700",
        odoo:
          "border-[#714b67]/20 bg-[#714b67]/10 text-[#714b67]",
        odooTeal:
          "border-teal-200 bg-teal-50 text-teal-700",
        muted:
          "border-slate-200 bg-slate-50 text-slate-500",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({ className, variant, ...props }) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }

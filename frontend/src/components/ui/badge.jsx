import * as React from "react"
import { cva } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border-0 px-2.5 py-0.5 text-xs font-medium transition-colors select-none",
  {
    variants: {
      variant: {
        default:
          "bg-[#714b67] text-white shadow-none",
        secondary:
          "bg-slate-100 text-slate-700",
        destructive:
          "bg-rose-100 text-rose-700",
        outline: "bg-slate-100/80 text-slate-700",
        success:
          "bg-emerald-50 text-emerald-700 font-medium",
        warning:
          "bg-amber-50 text-amber-800 font-medium",
        danger:
          "bg-rose-50 text-rose-700 font-medium",
        info:
          "bg-sky-50 text-sky-700 font-medium",
        odoo:
          "bg-[#714b67]/10 text-[#714b67] font-semibold",
        odooTeal:
          "bg-teal-50 text-teal-700 font-medium",
        muted:
          "bg-slate-100 text-slate-500",
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

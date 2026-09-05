import * as React from "react"
import { cva } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-lg border-0 text-xs font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#714b67]/30 disabled:pointer-events-none disabled:opacity-50 select-none",
  {
    variants: {
      variant: {
        default:
          "bg-[#714b67] text-white shadow-xs hover:bg-[#5e3c55] active:scale-[0.98]",
        teal:
          "bg-[#00a09d] text-white shadow-xs hover:bg-[#008784] active:scale-[0.98]",
        destructive:
          "bg-rose-600 text-white shadow-xs hover:bg-rose-700",
        outline:
          "bg-slate-100 text-slate-700 hover:bg-slate-200/70 hover:text-slate-900",
        secondary:
          "bg-slate-100 text-slate-700 hover:bg-slate-200/80",
        ghost: "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
        link: "text-[#714b67] underline-offset-4 hover:underline",
      },
      size: {
        default: "h-8 px-3.5 py-1.5",
        sm: "h-7 rounded-md px-2.5 text-xs",
        lg: "h-9 rounded-md px-5 text-sm",
        icon: "h-8 w-8",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const Button = React.forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => {
  return (
    <button
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      {...props}
    />
  )
})
Button.displayName = "Button"

export { Button, buttonVariants }

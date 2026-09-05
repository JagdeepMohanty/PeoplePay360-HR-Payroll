import * as React from "react"
import { cn } from "@/lib/utils"

const Input = React.forwardRef(({ className, type, ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        "flex h-8 w-full rounded-md border border-slate-200 bg-white px-3 py-1 text-xs text-slate-900 shadow-none transition-colors file:border-0 file:bg-transparent file:text-xs file:font-medium placeholder:text-slate-400 focus-visible:outline-none focus-visible:border-[#714b67] focus-visible:ring-1 focus-visible:ring-[#714b67]/30 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      ref={ref}
      {...props}
    />
  )
})
Input.displayName = "Input"

export { Input }

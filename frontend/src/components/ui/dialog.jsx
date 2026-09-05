import * as React from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

const DialogContext = React.createContext({
  open: false,
  onOpenChange: () => {},
})

const Dialog = ({ open, onOpenChange, children }) => {
  return (
    <DialogContext.Provider value={{ open, onOpenChange }}>
      {children}
    </DialogContext.Provider>
  )
}

const DialogTrigger = ({ asChild, children, ...props }) => {
  const { onOpenChange } = React.useContext(DialogContext)
  return React.cloneElement(children, {
    onClick: () => onOpenChange(true),
    ...props,
  })
}

const DialogContent = React.forwardRef(
  ({ className, children, ...props }, ref) => {
    const { open, onOpenChange } = React.useContext(DialogContext)

    if (!open) return null

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Soft Backdrop */}
        <div
          className="fixed inset-0 bg-slate-900/30 backdrop-blur-[1px] transition-opacity animate-in fade-in-0 duration-150"
          onClick={() => onOpenChange(false)}
        />
        {/* Modal Window */}
        <div
          ref={ref}
          className={cn(
            "relative z-50 grid w-full max-w-lg gap-4 border border-slate-200 bg-white p-6 shadow-xl duration-200 animate-in zoom-in-95 rounded-lg text-slate-900",
            className
          )}
          {...props}
        >
          {children}
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="absolute right-4 top-4 rounded p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </button>
        </div>
      </div>
    )
  }
)
DialogContent.displayName = "DialogContent"

const DialogHeader = ({ className, ...props }) => (
  <div
    className={cn("flex flex-col space-y-1 text-left", className)}
    {...props}
  />
)
DialogHeader.displayName = "DialogHeader"

const DialogFooter = ({ className, ...props }) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 pt-4 border-t border-slate-100",
      className
    )}
    {...props}
  />
)
DialogFooter.displayName = "DialogFooter"

const DialogTitle = React.forwardRef(({ className, ...props }, ref) => (
  <h2
    ref={ref}
    className={cn("text-base font-semibold text-slate-900", className)}
    {...props}
  />
))
DialogTitle.displayName = "DialogTitle"

const DialogDescription = React.forwardRef(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-xs text-slate-500", className)}
    {...props}
  />
))
DialogDescription.displayName = "DialogDescription"

export {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
}

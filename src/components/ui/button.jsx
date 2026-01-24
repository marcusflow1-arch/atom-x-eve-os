import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils"

const buttonVariants = cva(
        "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
        {
    variants: {
      variant: {
        default:
                        "bg-white/10 text-white border border-white/10 backdrop-blur-md shadow-sm hover:bg-white/15",
        destructive:
                        "bg-red-500/20 text-red-300 border border-red-500/30 backdrop-blur-md hover:bg-red-500/30",
        outline:
                        "border border-white/10 bg-white/5 text-white/80 backdrop-blur-md shadow-sm hover:bg-white/10 hover:text-white",
        secondary:
                        "bg-slate-800/50 text-white/90 border border-white/10 shadow-sm backdrop-blur-md hover:bg-slate-800/70",
        ghost: "hover:bg-white/10 hover:text-white/90 text-white/70",
        link: "text-cyan-300 underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const Button = React.forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button"
  return (
    (<Comp
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      {...props} />)
  );
})
Button.displayName = "Button"

export { Button, buttonVariants }
import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef(({ className, type, ...props }, ref) => {
  return (
    (<input
      type={type}
      className={cn(
                    "flex h-9 w-full rounded-xl border border-white/10 bg-white/5 backdrop-blur-md px-3 py-2 text-white placeholder-white/40 shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
                    className
                  )}
      ref={ref}
      {...props} />)
  );
})
Input.displayName = "Input"

export { Input }
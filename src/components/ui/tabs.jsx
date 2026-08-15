import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"

import { cn } from "@/lib/utils"

const Tabs = TabsPrimitive.Root

const TabsList = React.forwardRef(({ className, children, ...props }, ref) => {
  const childCount = React.Children.count(children)
  const manyTabs = childCount > 10

  return (
    <TabsPrimitive.List
      ref={ref}
      className={cn(
        manyTabs
          ? "grid w-full grid-cols-10 h-auto items-stretch justify-start gap-2 bg-transparent p-0 text-muted-foreground"
          : "flex flex-wrap h-auto items-stretch justify-start gap-2 bg-transparent p-0 text-muted-foreground",
        className
      )}
      {...props}
    >
      {children}
    </TabsPrimitive.List>
  )
})
TabsList.displayName = TabsPrimitive.List.displayName

const TabsTrigger = React.forwardRef(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      "inline-flex min-w-0 min-h-10 items-center justify-center whitespace-normal break-words rounded-lg border border-slate-700/80 bg-slate-900/80 px-3 py-2 text-center text-sm font-medium leading-tight text-slate-300 shadow-sm ring-offset-background transition-all hover:border-slate-600 hover:bg-slate-800/90 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:border-cyan-400/50 data-[state=active]:bg-cyan-500/15 data-[state=active]:text-cyan-100 data-[state=active]:shadow",
      className
    )}
    {...props} />
))
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName

const TabsContent = React.forwardRef(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-3 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      className
    )}
    {...props} />
))
TabsContent.displayName = TabsPrimitive.Content.displayName

export { Tabs, TabsList, TabsTrigger, TabsContent }

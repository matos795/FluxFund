import type { ReactNode } from "react"

import {
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

type AppDialogSize = "sm" | "md" | "lg" | "xl" | "full"

const sizeClasses: Record<AppDialogSize, string> = {
  sm: "sm:max-w-lg",
  md: "sm:max-w-2xl",
  lg: "sm:max-w-4xl",
  xl: "sm:max-w-5xl",
  full: "sm:max-w-6xl",
}

type AppDialogContentProps = React.ComponentProps<typeof DialogContent> & {
  size?: AppDialogSize
}

export function AppDialogContent({
  size = "lg",
  className,
  children,
  ...props
}: AppDialogContentProps) {
  return (
    <DialogContent
      className={cn(
        "flex max-h-[92vh] flex-col overflow-hidden p-0",
        sizeClasses[size],
        className,
      )}
      {...props}
    >
      {children}
    </DialogContent>
  )
}

type AppDialogHeaderProps = {
  title: ReactNode
  description?: ReactNode
  icon?: ReactNode
  aside?: ReactNode
  className?: string
}

export function AppDialogHeader({
  title,
  description,
  icon,
  aside,
  className,
}: AppDialogHeaderProps) {
  return (
    <DialogHeader
      className={cn(
        "border-b bg-muted/30 px-5 py-4 text-left",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-4 pr-8">
        <div className="flex min-w-0 items-start gap-3">
          {icon && (
            <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl border bg-background shadow-sm">
              {icon}
            </div>
          )}

          <div className="min-w-0 space-y-1">
            <DialogTitle className="text-base font-semibold">
              {title}
            </DialogTitle>

            {description && (
              <DialogDescription className="text-sm leading-relaxed">
                {description}
              </DialogDescription>
            )}
          </div>
        </div>

        {aside && <div className="shrink-0">{aside}</div>}
      </div>
    </DialogHeader>
  )
}

type AppDialogBodyProps = React.ComponentProps<"div">

export function AppDialogBody({ className, ...props }: AppDialogBodyProps) {
  return (
    <div
      className={cn("min-h-0 flex-1 overflow-y-auto px-5 py-5", className)}
      {...props}
    />
  )
}

type AppDialogFooterProps = React.ComponentProps<"div">

export function AppDialogFooter({ className, ...props }: AppDialogFooterProps) {
  return (
    <div
      className={cn(
        "flex flex-col-reverse gap-2 border-t bg-muted/30 px-5 py-4 sm:flex-row sm:justify-end",
        className,
      )}
      {...props}
    />
  )
}

type AppDialogSectionProps = React.ComponentProps<"section"> & {
  title?: ReactNode
  description?: ReactNode
  action?: ReactNode
}

export function AppDialogSection({
  title,
  description,
  action,
  className,
  children,
  ...props
}: AppDialogSectionProps) {
  return (
    <section
      className={cn("rounded-xl border bg-card p-4 shadow-sm", className)}
      {...props}
    >
      {(title || description || action) && (
        <div className="mb-4 flex items-start justify-between gap-4">
          <div className="space-y-1">
            {title && <h3 className="text-sm font-semibold">{title}</h3>}
            {description && (
              <p className="text-xs leading-relaxed text-muted-foreground">
                {description}
              </p>
            )}
          </div>

          {action}
        </div>
      )}

      {children}
    </section>
  )
}

type AppDialogStatCardProps = {
  label: string
  value: ReactNode
  description?: ReactNode
  className?: string
}

export function AppDialogStatCard({
  label,
  value,
  description,
  className,
}: AppDialogStatCardProps) {
  return (
    <div className={cn("rounded-xl border bg-background p-3", className)}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="mt-1 truncate text-sm font-semibold">{value}</div>
      {description && (
        <p className="mt-1 text-xs text-muted-foreground">{description}</p>
      )}
    </div>
  )
}
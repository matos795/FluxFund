import { Building2 } from "lucide-react"

import { cn } from "@/lib/utils"

import { useOrganizationLogo } from "../hooks/use-organization-logo"

type OrganizationLogoProps = {
  organizationName: string
  hasLogo: boolean
  className?: string
  imageClassName?: string
}

export function OrganizationLogo({
  organizationName,
  hasLogo,
  className,
  imageClassName,
}: OrganizationLogoProps) {
  const logoQuery = useOrganizationLogo(hasLogo)

  const logoDataUrl = hasLogo ? logoQuery.data : null

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center overflow-hidden bg-muted",
        className,
      )}
    >
      {logoDataUrl ? (
        <img
          src={logoDataUrl}
          alt={`Logo da organização ${organizationName}`}
          className={cn(
            "h-full w-full object-contain p-2",
            imageClassName,
          )}
        />
      ) : (
        <Building2 className="size-5 text-muted-foreground" />
      )}
    </div>
  )
}
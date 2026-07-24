import {
  useEffect,
  useRef,
} from "react"

import { cn } from "@/lib/utils"

import { useUserOrganizationLogo } from "../hooks/use-user-organization-logo"

type UserOrganizationLogoProps = {
  organizationId: string
  organizationName: string
  hasLogo: boolean
  className?: string
  imageClassName?: string
}

export function UserOrganizationLogo({
  organizationId,
  organizationName,
  hasLogo,
  className,
  imageClassName,
}: UserOrganizationLogoProps) {
  const logoQuery =
    useUserOrganizationLogo(
      organizationId,
      hasLogo,
    )

  const imageRef =
    useRef<HTMLImageElement>(null)

  useEffect(() => {
    const imageElement = imageRef.current
    const logoBlob = logoQuery.data

    if (!imageElement || !logoBlob) {
      return
    }

    const objectUrl =
      URL.createObjectURL(logoBlob)

    imageElement.src = objectUrl

    return () => {
      imageElement.removeAttribute("src")
      URL.revokeObjectURL(objectUrl)
    }
  }, [logoQuery.data])

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-primary/10 font-bold text-primary",
        className,
      )}
    >
      {logoQuery.data ? (
        <img
          ref={imageRef}
          alt={`Logo de ${organizationName}`}
          className={cn(
            "size-full object-contain p-1.5",
            imageClassName,
          )}
        />
      ) : (
        organizationName
          .charAt(0)
          .toUpperCase()
      )}
    </div>
  )
}
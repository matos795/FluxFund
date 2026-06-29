export type OrganizationLogo = {
  originalFilename: string
  contentType: string
  sizeBytes: number
  uploadedAt: string
}

export type OrganizationProfile = {
  id: string
  name: string
  active: boolean

  legalName: string | null
  cnpj: string | null
  contactEmail: string | null
  contactPhone: string | null

  addressLine: string | null
  addressNumber: string | null
  addressComplement: string | null
  neighborhood: string | null
  city: string | null
  state: string | null
  zipCode: string | null

  reviewerName: string | null
  reviewerTitle: string | null
  approverName: string | null
  approverTitle: string | null

  logo: OrganizationLogo | null

  createdAt: string
  updatedAt: string | null
}

export type UpdateOrganizationProfileRequest = {
  name: string
  legalName?: string
  cnpj?: string
  contactEmail?: string
  contactPhone?: string

  addressLine?: string
  addressNumber?: string
  addressComplement?: string
  neighborhood?: string
  city?: string
  state?: string
  zipCode?: string

  reviewerName?: string
  reviewerTitle?: string
  approverName?: string
  approverTitle?: string
}
export type OrganizationProfile = {
  id: string
  name: string
  active?: boolean
  createdAt?: string
  updatedAt?: string | null
}

export type UpdateOrganizationProfileRequest = {
  name: string
}

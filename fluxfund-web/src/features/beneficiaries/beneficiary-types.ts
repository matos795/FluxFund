export type BeneficiaryType =
    | 'MISSIONARY'
    | 'SUPPLIER'
    | 'EMPLOYEE'
    | 'PROJECT_RESPONSIBLE'
    | 'OTHER'

export type Beneficiary = {
    id: string
    name: string
    type: BeneficiaryType
    document: string | null
    email: string | null
    phone: string | null
    active: boolean
    createdAt: string
    updatedAt: string
}

export type CreateBeneficiaryRequest = {
    name: string
    type: BeneficiaryType
    document?: string
    email?: string 
    phone?: string
}

export type UpdateBeneficiaryRequest = {
    id: string
    name?: string
    type?: BeneficiaryType
    document?: string
    email?: string 
    phone?: string
}

export type BeneficiarySummary = {
    id: string
    name: string
    type: BeneficiaryType
}
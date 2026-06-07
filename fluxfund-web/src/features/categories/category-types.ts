export type CategoryType = 'INCOME' | 'EXPENSE'

export type CategorySummary = {
  id: string
  name: string
  type: CategoryType
  parentName: string | null
}

export type Category = {
    id: string
    name: string
    type: CategoryType
    parent: CategorySummary | null
    active: boolean
    createdAt: string
    updatedAt: string
}

export type CreateCategoryRequest = {
    name: string
    type: CategoryType
    parentId?: string | null
}

export type UpdateCategoryRequest = {
    id: string
    name?: string
    type?: CategoryType
    parentId?: string | null
}

export type CategoryOption = {
  id: string
  name: string
  label: string
  type: CategoryType
  parentId: string | null
  parentName: string | null
  level: number
}
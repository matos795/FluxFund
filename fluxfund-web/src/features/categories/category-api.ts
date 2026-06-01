import type { PageResponse } from "@/types/page-response"
import type { Category, CreateCategoryRequest, UpdateCategoryRequest } from "./category-types"
import { httpClient } from "@/api/http-client"

type GetCategoriesParams = {
    page?: number
    size?: number
}

export async function getCategories({
    page = 0,
    size = 10,
}: GetCategoriesParams = {}) {
    const response = await httpClient.get<PageResponse<Category>>("/api/v1/categories",
        {
            params: {
                page,
                size,
            }
        }
    )
    return response.data
}

export async function createCategory(data: CreateCategoryRequest) {
    const response = await httpClient.post<Category>("/api/v1/categories", data)
    return response.data
}

export async function updateCategory(data: UpdateCategoryRequest) {
    const { id, ...body } = data
    const response = await httpClient.put<Category>(`/api/v1/categories/${id}`, body)
    return response.data
}

export async function deleteCategory(id: string) {
    await httpClient.delete(`/api/v1/categories/${id}`)
}
import type { PageResponse } from "@/types/page-response"
import type { Category, CreateCategoryRequest, UpdateCategoryRequest } from "./category-types"
import { httpClient } from "@/api/http-client"


const TEMP_ORGANIZATION_ID = "7b9ed617-92be-456d-81d6-dcde5841e7a0"

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
                organizationId: TEMP_ORGANIZATION_ID,
                page,
                size,
            }
        }
    )
    return response.data
}

export async function createCategory(data: CreateCategoryRequest) {
    const response = await httpClient.post<Category>("/api/v1/categories", data, {
        params: {
            organizationId: TEMP_ORGANIZATION_ID,
        },
    })
    return response.data
}

export async function updateCategory(data: UpdateCategoryRequest) {
    const { id, ...body } = data
    const response = await httpClient.put<Category>(`/api/v1/categories/${id}`, body, {
        params: {
            organizationId: TEMP_ORGANIZATION_ID,
        },
    })
    return response.data
}

export async function deleteCategory(id: string) {
    await httpClient.delete(`/api/v1/categories/${id}`, {
        params: {
            organizationId: TEMP_ORGANIZATION_ID,
        },
    })
}
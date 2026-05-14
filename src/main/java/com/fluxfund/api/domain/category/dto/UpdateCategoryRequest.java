package com.fluxfund.api.domain.category.dto;

import java.util.UUID;

import com.fluxfund.api.domain.category.CategoryType;

public record UpdateCategoryRequest(
        String name,
        CategoryType type,
        UUID parentId
    ) {
}

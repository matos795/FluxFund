package com.fluxfund.api.domain.category.dto;

import java.util.UUID;

import com.fluxfund.api.domain.category.CategoryType;

public record CategoryOptionResponse(
        UUID id,
        String name,
        String label,
        CategoryType type,
        UUID parentId,
        String parentName,
        int level
) {
}
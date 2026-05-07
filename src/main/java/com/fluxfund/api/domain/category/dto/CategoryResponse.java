package com.fluxfund.api.domain.category.dto;

import java.time.OffsetDateTime;
import java.util.UUID;

import com.fluxfund.api.domain.category.CategoryType;

public record CategoryResponse(
        UUID id,
        UUID organizationId,
        String name,
        CategoryType type,
        UUID parentId,
        String parentName,
        Boolean active,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
    ) {
}

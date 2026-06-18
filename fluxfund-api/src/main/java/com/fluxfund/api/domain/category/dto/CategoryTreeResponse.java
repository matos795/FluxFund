package com.fluxfund.api.domain.category.dto;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

import com.fluxfund.api.domain.category.CategoryType;

public record CategoryTreeResponse(
        UUID id,
        UUID organizationId,
        String name,
        CategoryType type,
        CategorySummaryResponse parent,
        Boolean active,
        Boolean requiresFiscalDocument,
        Boolean requiresPaymentProof,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt,
        List<CategoryTreeResponse> children
) {
}
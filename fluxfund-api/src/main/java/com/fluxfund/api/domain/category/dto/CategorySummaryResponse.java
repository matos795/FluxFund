package com.fluxfund.api.domain.category.dto;

import java.util.UUID;

import com.fluxfund.api.domain.category.CategoryType;

public record CategorySummaryResponse(
    UUID id,
    String name,
    CategoryType type,
    String parentName
) {}
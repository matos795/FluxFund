package com.fluxfund.api.domain.category.dto;

import java.util.UUID;

import com.fluxfund.api.domain.category.CategoryType;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CreateCategoryRequest(
        @NotBlank
        String name,
        @NotNull
        CategoryType type,
        UUID parentId
){
}

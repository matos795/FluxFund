package com.fluxfund.api.domain.category.mapper;

import com.fluxfund.api.domain.category.Category;
import com.fluxfund.api.domain.category.dto.CategoryResponse;
import com.fluxfund.api.domain.category.dto.CreateCategoryRequest;
import com.fluxfund.api.domain.category.dto.UpdateCategoryRequest;
import com.fluxfund.api.domain.organization.Organization;

public class CategoryMapper {

    public static Category createEntity(CreateCategoryRequest request, Organization organization, Category parent) {

        return new Category(
            organization,
            request.name(),
            request.type(),
            parent,
            true
        );
    }

    public static CategoryResponse toResponse(Category category) {
        return new CategoryResponse(
            category.getId(),
            category.getOrganization().getId(),
            category.getName(),
            category.getType(),
            category.getParent() != null ? category.getParent().getId() : null,
            category.getParent() != null ? category.getParent().getName() : null,
            category.isActive(),
            category.getCreatedAt(),
            category.getUpdatedAt()
        );
    }

    public static void updateEntity(Category category, UpdateCategoryRequest request, Category parent) {

        if (request.name() != null) {
            category.setName(request.name());
        }
        if (request.type() != null) {
            category.setType(request.type());
        }
        
        category.setParent(parent);

        if (request.active() != null) {
            category.setActive(request.active());
        }
    }
}

package com.fluxfund.api.domain.category.mapper;

import java.util.List;

import com.fluxfund.api.domain.category.Category;
import com.fluxfund.api.domain.category.CategoryType;
import com.fluxfund.api.domain.category.dto.CategoryResponse;
import com.fluxfund.api.domain.category.dto.CategorySummaryResponse;
import com.fluxfund.api.domain.category.dto.CategoryTreeResponse;
import com.fluxfund.api.domain.category.dto.CreateCategoryRequest;
import com.fluxfund.api.domain.category.dto.UpdateCategoryRequest;
import com.fluxfund.api.domain.organization.Organization;

public class CategoryMapper {

    public static Category createEntity(
            CreateCategoryRequest request,
            Organization organization,
            Category parent) {

        Category category = new Category();

        category.setOrganization(organization);
        category.setName(request.name());
        category.setType(request.type());
        category.setParent(parent);
        category.setActive(true);

        category.setRequiresFiscalDocument(
                request.requiresFiscalDocument() != null
                        ? request.requiresFiscalDocument()
                        : request.type() == CategoryType.EXPENSE);

        category.setRequiresPaymentProof(
                request.requiresPaymentProof() != null
                        && request.requiresPaymentProof());

        return category;
    }

    public static CategoryResponse toResponse(Category category) {
        return new CategoryResponse(
                category.getId(),
                category.getOrganization().getId(),
                category.getName(),
                category.getType(),
                category.getParent() != null ? toSummary(category.getParent()) : null,
                category.isActive(),
                category.isRequiresFiscalDocument(),
                category.isRequiresPaymentProof(),
                category.getCreatedAt(),
                category.getUpdatedAt());
    }

    public static CategorySummaryResponse toSummary(Category category) {
        return new CategorySummaryResponse(
                category.getId(),
                category.getName(),
                category.getType(),
                category.getParent() != null ? category.getParent().getName() : null,
                category.isRequiresFiscalDocument(),
                category.isRequiresPaymentProof());
    }

    public static void updateEntity(
            Category category,
            UpdateCategoryRequest request,
            Category parent) {

        if (request.name() != null) {
            category.setName(request.name());
        }

        if (request.type() != null) {
            category.setType(request.type());
        }

        category.setParent(parent);

        if (request.requiresFiscalDocument() != null) {
            category.setRequiresFiscalDocument(request.requiresFiscalDocument());
        }

        if (request.requiresPaymentProof() != null) {
            category.setRequiresPaymentProof(request.requiresPaymentProof());
        }
    }

    public static CategoryTreeResponse toTreeResponse(
            Category category,
            List<CategoryTreeResponse> children) {

        return new CategoryTreeResponse(
                category.getId(),
                category.getOrganization().getId(),
                category.getName(),
                category.getType(),
                category.getParent() != null ? toSummary(category.getParent()) : null,
                category.isActive(),
                category.isRequiresFiscalDocument(),
                category.isRequiresPaymentProof(),
                category.getCreatedAt(),
                category.getUpdatedAt(),
                children);
    }
}

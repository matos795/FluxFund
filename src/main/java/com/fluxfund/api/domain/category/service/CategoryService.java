package com.fluxfund.api.domain.category.service;

import java.util.Objects;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.fluxfund.api.domain.category.Category;
import com.fluxfund.api.domain.category.CategoryType;
import com.fluxfund.api.domain.category.dto.CategoryResponse;
import com.fluxfund.api.domain.category.dto.CreateCategoryRequest;
import com.fluxfund.api.domain.category.dto.UpdateCategoryRequest;
import com.fluxfund.api.domain.category.mapper.CategoryMapper;
import com.fluxfund.api.domain.category.repository.CategoryRepository;
import com.fluxfund.api.domain.organization.Organization;
import com.fluxfund.api.domain.organization.OrganizationRepository;
import com.fluxfund.api.shared.exception.BusinessException;
import com.fluxfund.api.shared.exception.ResourceNotFoundException;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class CategoryService {

    private final CategoryRepository categoryRepository;
    private final OrganizationRepository organizationRepository;

    public CategoryResponse create(CreateCategoryRequest request) {

        UUID organizationId = Objects.requireNonNull(request.organizationId(), "Organization id is required");

        Organization organization = organizationRepository.findById(organizationId)
                .orElseThrow(() -> new ResourceNotFoundException("Organization not found"));

        Category parent = null;

        if (request.parentId() != null) {
            parent = categoryRepository.findById(request.parentId())
                    .orElseThrow(() -> new ResourceNotFoundException("Parent category not found"));
        }

        if (parent != null && parent.getType() != request.type()) {
            throw new BusinessException(
                    "Parent category must have the same type");
        }

        if (parent != null &&
                !parent.getOrganization().getId().equals(organizationId)) {

            throw new BusinessException(
                    "Parent category must belong to the same organization");
        }

        Category category = CategoryMapper.createEntity(request, organization, parent);

        categoryRepository.save(category);

        return CategoryMapper.toResponse(category);
    }

    @Transactional(readOnly = true)
    public Page<CategoryResponse> findAll(
            UUID organizationId,
            Pageable pageable) {

        return categoryRepository
                .findAllByOrganizationIdAndActiveTrue(organizationId, pageable)
                .map(CategoryMapper::toResponse);
    }

    @Transactional(readOnly = true)
    public CategoryResponse findById(UUID id) {

        Category category = categoryRepository.findById(Objects.requireNonNull(id))
                .orElseThrow(() -> new ResourceNotFoundException("Category not found"));

        return CategoryMapper.toResponse(category);
    }

    public CategoryResponse update(
            UUID id,
            UpdateCategoryRequest request) {

        Category category = categoryRepository.findById(Objects.requireNonNull(id))
                .orElseThrow(() -> new ResourceNotFoundException("Category not found"));

        Category parent = null;

        if (request.parentId() != null) {
            parent = categoryRepository.findById(request.parentId())
                    .orElseThrow(() -> new ResourceNotFoundException("Parent category not found"));
        }

        CategoryType finalType = request.type() != null
                ? request.type()
                : category.getType();

        if (parent != null && parent.getType() != finalType) {
            throw new BusinessException(
                    "Parent category must have the same type");
        }

        if (parent != null &&
                !parent.getOrganization().getId().equals(category.getOrganization().getId())) {

            throw new BusinessException(
                    "Parent category must belong to the same organization");
        }

        if (parent != null && parent.getId().equals(id)) {
            throw new BusinessException(
                    "Category cannot be its own parent");
        }

        CategoryMapper.updateEntity(category, request, parent);
        categoryRepository.save(category);

        return CategoryMapper.toResponse(category);
    }

    public void delete(UUID id) {

        Category category = categoryRepository.findById(Objects.requireNonNull(id))
                .orElseThrow(() -> new ResourceNotFoundException("Category not found"));

        category.setActive(false);
        categoryRepository.save(category);
    }
}

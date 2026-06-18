package com.fluxfund.api.domain.category.service;

import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.fluxfund.api.domain.category.Category;
import com.fluxfund.api.domain.category.CategoryType;
import com.fluxfund.api.domain.category.dto.CategoryOptionResponse;
import com.fluxfund.api.domain.category.dto.CategoryResponse;
import com.fluxfund.api.domain.category.dto.CategoryTreeResponse;
import com.fluxfund.api.domain.category.dto.CreateCategoryRequest;
import com.fluxfund.api.domain.category.dto.UpdateCategoryRequest;
import com.fluxfund.api.domain.category.mapper.CategoryMapper;
import com.fluxfund.api.domain.category.repository.CategoryRepository;
import com.fluxfund.api.domain.organization.Organization;
import com.fluxfund.api.domain.organization.OrganizationRepository;
import com.fluxfund.api.security.OrganizationAccessService;
import com.fluxfund.api.shared.exception.BusinessException;
import com.fluxfund.api.shared.exception.ResourceNotFoundException;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class CategoryService {

        private final CategoryRepository categoryRepository;
        private final OrganizationRepository organizationRepository;
        private final OrganizationAccessService organizationAccessService;

        public CategoryResponse create(CreateCategoryRequest request, UUID organizationId) {
                organizationAccessService.requireFinanceWriteAccess(organizationId);

                Organization organization = organizationRepository.findByIdAndActiveTrue(organizationId)
                                .orElseThrow(() -> new ResourceNotFoundException("Organization not found"));

                Category parent = null;

                if (request.parentId() != null) {
                        parent = categoryRepository
                                        .findByIdAndOrganizationIdAndActiveTrue(request.parentId(), organizationId)
                                        .orElseThrow(() -> new ResourceNotFoundException("Parent category not found"));
                }

                if (parent != null && parent.getParent() != null) {
                        throw new BusinessException(
                                        "Parent category cannot be a subcategory");
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
                organizationAccessService.requireReadAccess(organizationId);

                return categoryRepository
                                .findAllByOrganizationIdAndActiveTrue(organizationId, pageable)
                                .map(CategoryMapper::toResponse);
        }

        @Transactional(readOnly = true)
        public CategoryResponse findById(UUID id, UUID organizationId) {
                organizationAccessService.requireReadAccess(organizationId);

                Category category = categoryRepository.findByIdAndOrganizationIdAndActiveTrue(id, organizationId)
                                .orElseThrow(() -> new ResourceNotFoundException("Category not found"));

                return CategoryMapper.toResponse(category);
        }

        public CategoryResponse update(
                        UUID organizationId,
                        UUID id,
                        UpdateCategoryRequest request) {
                organizationAccessService.requireFinanceWriteAccess(organizationId);

                Category category = categoryRepository.findByIdAndOrganizationIdAndActiveTrue(id, organizationId)
                                .orElseThrow(() -> new ResourceNotFoundException("Category not found"));

                Category parent = null;

                if (request.parentId() != null) {
                        parent = categoryRepository
                                        .findByIdAndOrganizationIdAndActiveTrue(request.parentId(), organizationId)
                                        .orElseThrow(() -> new ResourceNotFoundException("Parent category not found"));
                }

                if (parent != null) {
                        validateParentDoesNotCreateCycle(category, parent);
                }

                if (parent != null && parent.getParent() != null) {
                        throw new BusinessException(
                                        "Parent category cannot be a subcategory");
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

        public void delete(UUID id, UUID organizationId) {
                organizationAccessService.requireFinanceWriteAccess(organizationId);

                Category category = categoryRepository.findByIdAndOrganizationIdAndActiveTrue(id, organizationId)
                                .orElseThrow(() -> new ResourceNotFoundException("Category not found"));

                category.setActive(false);
                categoryRepository.save(category);
        }

        @Transactional(readOnly = true)
        public List<CategoryOptionResponse> findOptions(
                        UUID organizationId,
                        CategoryType type) {

                organizationAccessService.requireReadAccess(organizationId);

                List<Category> categories = type != null
                                ? categoryRepository.findByOrganizationIdAndActiveTrueAndTypeOrderByNameAsc(
                                                organizationId,
                                                type)
                                : categoryRepository.findByOrganizationIdAndActiveTrueOrderByNameAsc(
                                                organizationId);

                return categories.stream()
                                .map(this::toOptionResponse)
                                .toList();
        }

        @Transactional(readOnly = true)
        public List<CategoryTreeResponse> findTree(
                        UUID organizationId,
                        CategoryType type,
                        boolean includeInactive) {

                organizationAccessService.requireReadAccess(organizationId);

                List<Category> categories = findCategoriesForTree(
                                organizationId,
                                type,
                                includeInactive);

                Map<UUID, Category> categoriesById = categories.stream()
                                .collect(Collectors.toMap(Category::getId, Function.identity()));

                Map<UUID, List<Category>> childrenByParentId = categories.stream()
                                .filter(category -> category.getParent() != null)
                                .filter(category -> categoriesById.containsKey(category.getParent().getId()))
                                .collect(Collectors.groupingBy(category -> category.getParent().getId()));

                Comparator<Category> categoryComparator = categoryComparator();

                childrenByParentId.values()
                                .forEach(children -> children.sort(categoryComparator));

                return categories.stream()
                                .filter(category -> category.getParent() == null ||
                                                !categoriesById.containsKey(category.getParent().getId()))
                                .sorted(categoryComparator)
                                .map(category -> toTreeResponse(
                                                category,
                                                childrenByParentId,
                                                new HashSet<>()))
                                .toList();
        }

        private CategoryOptionResponse toOptionResponse(Category category) {
                Category parent = category.getParent();

                String label = parent != null
                                ? parent.getName() + " > " + category.getName()
                                : category.getName();

                return new CategoryOptionResponse(
                                category.getId(),
                                category.getName(),
                                label,
                                category.getType(),
                                parent != null ? parent.getId() : null,
                                parent != null ? parent.getName() : null,
                                parent != null ? 1 : 0);
        }

        private List<Category> findCategoriesForTree(
                        UUID organizationId,
                        CategoryType type,
                        boolean includeInactive) {

                if (includeInactive && type != null) {
                        return categoryRepository.findByOrganizationIdAndType(
                                        organizationId,
                                        type);
                }

                if (includeInactive) {
                        return categoryRepository.findByOrganizationId(organizationId);
                }

                if (type != null) {
                        return categoryRepository.findByOrganizationIdAndActiveTrueAndType(
                                        organizationId,
                                        type);
                }

                return categoryRepository.findByOrganizationIdAndActiveTrue(
                                organizationId);
        }

        private CategoryTreeResponse toTreeResponse(
                        Category category,
                        Map<UUID, List<Category>> childrenByParentId,
                        Set<UUID> visited) {

                if (!visited.add(category.getId())) {
                        return CategoryMapper.toTreeResponse(category, List.of());
                }

                List<CategoryTreeResponse> children = childrenByParentId
                                .getOrDefault(category.getId(), List.of())
                                .stream()
                                .filter(child -> !visited.contains(child.getId()))
                                .map(child -> toTreeResponse(
                                                child,
                                                childrenByParentId,
                                                new HashSet<>(visited)))
                                .toList();

                return CategoryMapper.toTreeResponse(category, children);
        }

        private Comparator<Category> categoryComparator() {
                return Comparator
                                .comparing(Category::getType)
                                .thenComparing(
                                                category -> category.getName().toLowerCase(Locale.ROOT));
        }

        private void validateParentDoesNotCreateCycle(
                        Category category,
                        Category parent) {

                Category current = parent;

                while (current != null) {
                        if (current.getId().equals(category.getId())) {
                                throw new BusinessException(
                                                "Category cannot be moved under one of its own children");
                        }

                        current = current.getParent();
                }
        }
}

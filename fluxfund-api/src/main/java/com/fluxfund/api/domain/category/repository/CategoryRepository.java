package com.fluxfund.api.domain.category.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import com.fluxfund.api.domain.category.Category;
import com.fluxfund.api.domain.category.CategoryType;

public interface CategoryRepository extends JpaRepository<Category, UUID> {

    Page<Category> findAllByOrganizationIdAndActiveTrue(
            UUID organizationId,
            Pageable pageable);

    Optional<Category> findByIdAndOrganizationIdAndActiveTrue(
            UUID categoryId,
            UUID organizationId);

    List<Category> findByOrganizationIdAndActiveTrueOrderByNameAsc(
            UUID organizationId);

    List<Category> findByOrganizationIdAndActiveTrueAndTypeOrderByNameAsc(
            UUID organizationId,
            CategoryType type);

    @EntityGraph(attributePaths = "parent")
    List<Category> findByOrganizationId(UUID organizationId);

    @EntityGraph(attributePaths = "parent")
    List<Category> findByOrganizationIdAndType(
            UUID organizationId,
            CategoryType type);

    @EntityGraph(attributePaths = "parent")
    List<Category> findByOrganizationIdAndActiveTrue(
            UUID organizationId);

    @EntityGraph(attributePaths = "parent")
    List<Category> findByOrganizationIdAndActiveTrueAndType(
            UUID organizationId,
            CategoryType type);

    boolean existsByParentIdAndOrganizationIdAndActiveTrue(
            UUID parentId,
            UUID organizationId);
}
package com.fluxfund.api.domain.category.repository;

import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import com.fluxfund.api.domain.category.Category;

public interface CategoryRepository extends JpaRepository<Category, UUID> {

    Page<Category> findAllByOrganizationIdAndActiveTrue(
            UUID organizationId,
            Pageable pageable
    );
}

package com.fluxfund.api.domain.category.controller;

import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.fluxfund.api.domain.category.dto.CategoryResponse;
import com.fluxfund.api.domain.category.dto.CreateCategoryRequest;
import com.fluxfund.api.domain.category.dto.UpdateCategoryRequest;
import com.fluxfund.api.domain.category.service.CategoryService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/categories")
@RequiredArgsConstructor
public class CategoryController {

    private final CategoryService service;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public CategoryResponse create(
            @RequestParam UUID organizationId,
            @Valid @RequestBody CreateCategoryRequest request
    ) {
        return service.create(request, organizationId);
    }

    @GetMapping
    public Page<CategoryResponse> findAll(
            @RequestParam UUID organizationId,
            Pageable pageable
    ) {
        return service.findAll(organizationId, pageable);
    }

    @GetMapping("/{id}")
    public CategoryResponse findById(
            @RequestParam UUID organizationId,
            @PathVariable UUID id
    ) {
        return service.findById(id, organizationId);
    }

    @PutMapping("/{id}")
    public CategoryResponse update(
            @PathVariable UUID id,
            @RequestParam UUID organizationId,
            @Valid @RequestBody UpdateCategoryRequest request
    ) {
        return service.update(id, organizationId, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(
            @PathVariable UUID id,
            @RequestParam UUID organizationId
    ) {
        service.delete(id, organizationId);
    }
}

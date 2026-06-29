package com.fluxfund.api.domain.organization.controller;

import com.fluxfund.api.domain.organization.dto.CreateOrganizationRequest;
import com.fluxfund.api.domain.organization.dto.OrganizationResponse;
import com.fluxfund.api.domain.organization.service.OrganizationService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/organizations")
@RequiredArgsConstructor
public class OrganizationController {

    private final OrganizationService organizationService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public OrganizationResponse create(@RequestBody @Valid CreateOrganizationRequest request) {
        return organizationService.create(request);
    }

    @GetMapping
    public Page<OrganizationResponse> findAll(Pageable pageable) {
        return organizationService.findAll(pageable);
    }

    @GetMapping("/{id}")
    public OrganizationResponse findById(@PathVariable UUID id) {
        return organizationService.findById(id);
    }

    @PutMapping("/{id}")
    public OrganizationResponse update(
            @PathVariable UUID id,
            @RequestBody @Valid CreateOrganizationRequest request) {
        return organizationService.update(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID id) {
        organizationService.delete(id);
    }
}
package com.fluxfund.api.domain.supportagreement.controller;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.fluxfund.api.domain.supportagreement.dto.CreateSupportAgreementRequest;
import com.fluxfund.api.domain.supportagreement.dto.CreateSupportAgreementVersionRequest;
import com.fluxfund.api.domain.supportagreement.dto.SupportAgreementResponse;
import com.fluxfund.api.domain.supportagreement.dto.UpdateSupportAgreementRequest;
import com.fluxfund.api.domain.supportagreement.service.SupportAgreementService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import static com.fluxfund.api.security.TenantHeaders.ORGANIZATION_ID;

@RestController
@RequiredArgsConstructor
public class SupportAgreementController {

    private final SupportAgreementService service;

    @PostMapping("/api/v1/support-agreements")
    @ResponseStatus(HttpStatus.CREATED)
    public SupportAgreementResponse create(
            @RequestHeader(ORGANIZATION_ID) UUID organizationId,
            @Valid @RequestBody CreateSupportAgreementRequest request) {
        return service.create(organizationId, request);
    }

    @PostMapping("/api/v1/support-agreements/{id}/versions")
    @ResponseStatus(HttpStatus.CREATED)
    public SupportAgreementResponse createVersion(
            @RequestHeader(ORGANIZATION_ID) UUID organizationId,
            @PathVariable UUID id,
            @Valid @RequestBody CreateSupportAgreementVersionRequest request) {

        return service.createVersion(organizationId, id, request);
    }

    @GetMapping("/api/v1/support-agreements")
    public Page<SupportAgreementResponse> findAll(
            @RequestHeader(ORGANIZATION_ID) UUID organizationId,
            @RequestParam(required = false) Boolean active,
            Pageable pageable) {
        return service.findAll(organizationId, active, pageable);
    }

    @GetMapping("/api/v1/support-agreements/suggestions")
    public List<SupportAgreementResponse> findActiveSuggestions(
            @RequestHeader(ORGANIZATION_ID) UUID organizationId,
            @RequestParam UUID beneficiaryId,
            @RequestParam(required = false) LocalDate referenceDate) {
        return service.findActiveSuggestions(
                organizationId,
                beneficiaryId,
                referenceDate);
    }

    @GetMapping("/api/v1/support-agreements/{id}")
    public SupportAgreementResponse findById(
            @RequestHeader(ORGANIZATION_ID) UUID organizationId,
            @PathVariable UUID id) {
        return service.findById(organizationId, id);
    }

    @PutMapping("/api/v1/support-agreements/{id}")
    public SupportAgreementResponse update(
            @RequestHeader(ORGANIZATION_ID) UUID organizationId,
            @PathVariable UUID id,
            @Valid @RequestBody UpdateSupportAgreementRequest request) {
        return service.update(organizationId, id, request);
    }

    @DeleteMapping("/api/v1/support-agreements/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deactivate(
            @RequestHeader(ORGANIZATION_ID) UUID organizationId,
            @PathVariable UUID id) {
        service.deactivate(organizationId, id);
    }

    @PatchMapping("/api/v1/support-agreements/{id}/activate")
    public SupportAgreementResponse activate(
            @RequestHeader(ORGANIZATION_ID) UUID organizationId,
            @PathVariable UUID id) {
        return service.activate(organizationId, id);
    }
}
package com.fluxfund.api.domain.supportagreement.controller;

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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.fluxfund.api.domain.supportagreement.dto.CreateSupportAgreementRequest;
import com.fluxfund.api.domain.supportagreement.dto.SupportAgreementResponse;
import com.fluxfund.api.domain.supportagreement.dto.UpdateSupportAgreementRequest;
import com.fluxfund.api.domain.supportagreement.service.SupportAgreementService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
public class SupportAgreementController {

    private final SupportAgreementService service;

    @PostMapping("/api/v1/support-agreements")
    @ResponseStatus(HttpStatus.CREATED)
    public SupportAgreementResponse create(
            @Valid @RequestBody CreateSupportAgreementRequest request
    ) {
        return service.create(request);
    }

    @GetMapping("/api/v1/support-agreements")
    public Page<SupportAgreementResponse> findAll(
            @RequestParam UUID organizationId,
            @RequestParam(required = false) Boolean active,
            Pageable pageable
    ) {
        return service.findAll(organizationId, active, pageable);
    }

    @GetMapping("/api/v1/support-agreements/{id}")
    public SupportAgreementResponse findById(
            @RequestParam UUID organizationId,
            @PathVariable UUID id
    ) {
        return service.findById(organizationId, id);
    }

    @PutMapping("/api/v1/support-agreements/{id}")
    public SupportAgreementResponse update(
            @RequestParam UUID organizationId,
            @PathVariable UUID id,
            @Valid @RequestBody UpdateSupportAgreementRequest request
    ) {
        return service.update(organizationId, id, request);
    }

    @DeleteMapping("/api/v1/support-agreements/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deactivate(
            @RequestParam UUID organizationId,
            @PathVariable UUID id
    ) {
        service.deactivate(organizationId, id);
    }
}
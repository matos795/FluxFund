package com.fluxfund.api.domain.financialcommitment.controller;

import static com.fluxfund.api.security.TenantHeaders.ORGANIZATION_ID;

import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.fluxfund.api.domain.financialcommitment.FinancialCommitmentDirection;
import com.fluxfund.api.domain.financialcommitment.FinancialCommitmentRecurrence;
import com.fluxfund.api.domain.financialcommitment.FinancialCommitmentType;
import com.fluxfund.api.domain.financialcommitment.dto.CreateFinancialCommitmentRequest;
import com.fluxfund.api.domain.financialcommitment.dto.FinancialCommitmentResponse;
import com.fluxfund.api.domain.financialcommitment.dto.UpdateFinancialCommitmentRequest;
import com.fluxfund.api.domain.financialcommitment.service.FinancialCommitmentService;
import com.fluxfund.api.domain.supportagreement.SupportAgreementStatus;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/financial-commitments")
@RequiredArgsConstructor
public class FinancialCommitmentController {

    private final FinancialCommitmentService service;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public FinancialCommitmentResponse create(

            @RequestHeader(ORGANIZATION_ID) UUID organizationId,

            @Valid @RequestBody CreateFinancialCommitmentRequest request) {

        return service.create(organizationId, request);
    }

    @GetMapping
    public Page<FinancialCommitmentResponse> findAll(

            @RequestHeader(ORGANIZATION_ID) UUID organizationId,

            @RequestParam(required = false) String search,

            @RequestParam(required = false) FinancialCommitmentDirection direction,

            @RequestParam(required = false) FinancialCommitmentType commitmentType,

            @RequestParam(required = false) FinancialCommitmentRecurrence recurrence,

            @RequestParam(required = false) SupportAgreementStatus status,

            @RequestParam(required = false) UUID partyId,

            @RequestParam(required = false) UUID designatedRecipientId,

            @RequestParam(required = false) UUID fundId,

            @PageableDefault(size = 20, sort = "startDate", direction = Sort.Direction.DESC) Pageable pageable) {

        return service.findAll(

                organizationId,

                search,

                direction,

                commitmentType,

                recurrence,

                status,

                partyId,

                designatedRecipientId,

                fundId,

                pageable);
    }

    @GetMapping("/{id}")
    public FinancialCommitmentResponse findById(

            @RequestHeader(ORGANIZATION_ID) UUID organizationId,

            @PathVariable UUID id) {

        return service.findById(
                organizationId,
                id);
    }

    @PutMapping("/{id}")
    public FinancialCommitmentResponse update(

            @RequestHeader(ORGANIZATION_ID) UUID organizationId,

            @PathVariable UUID id,

            @Valid @RequestBody UpdateFinancialCommitmentRequest request) {

        return service.update(
                organizationId,
                id,
                request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deactivate(

            @RequestHeader(ORGANIZATION_ID) UUID organizationId,

            @PathVariable UUID id) {

        service.deactivate(
                organizationId,
                id);
    }

    @PatchMapping("/{id}/activate")
    public FinancialCommitmentResponse activate(
            @RequestHeader(ORGANIZATION_ID) UUID organizationId,
            @PathVariable UUID id) {

        return service.activate(organizationId, id);
    }
}
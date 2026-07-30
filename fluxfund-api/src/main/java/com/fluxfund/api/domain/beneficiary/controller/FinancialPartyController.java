package com.fluxfund.api.domain.beneficiary.controller;

import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.fluxfund.api.domain.beneficiary.BeneficiaryType;
import com.fluxfund.api.domain.beneficiary.FinancialPartyRole;
import com.fluxfund.api.domain.beneficiary.FinancialPartyType;
import com.fluxfund.api.domain.beneficiary.dto.BeneficiaryResponse;
import com.fluxfund.api.domain.beneficiary.dto.CreateBeneficiaryRequest;
import com.fluxfund.api.domain.beneficiary.dto.FinancialPartyOptionResponse;
import com.fluxfund.api.domain.beneficiary.dto.UpdateBeneficiaryRequest;
import com.fluxfund.api.domain.beneficiary.service.BeneficiaryService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import static com.fluxfund.api.security.TenantHeaders.ORGANIZATION_ID;

@RestController
@RequestMapping("/api/v1/financial-parties")
@RequiredArgsConstructor
public class FinancialPartyController {

    private final BeneficiaryService service;

    @PostMapping
    public ResponseEntity<BeneficiaryResponse> create(
            @RequestHeader(ORGANIZATION_ID) UUID organizationId,
            @RequestBody @Valid CreateBeneficiaryRequest request) {

        BeneficiaryResponse response = service.create(request, organizationId);

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    public ResponseEntity<Page<BeneficiaryResponse>> findAll(
            @RequestHeader(ORGANIZATION_ID) UUID organizationId,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) FinancialPartyType partyType,
            @RequestParam(required = false) BeneficiaryType classification,
            @RequestParam(required = false) FinancialPartyRole role,
            @RequestParam(required = false, defaultValue = "true") Boolean active,
            @PageableDefault(size = 20, sort = "name", direction = Sort.Direction.ASC) Pageable pageable) {

        return ResponseEntity.ok(service.findAllFinancialParties(
                organizationId,
                search,
                partyType,
                classification,
                role,
                active,
                pageable));
    }

    @GetMapping("/options")
    public ResponseEntity<List<FinancialPartyOptionResponse>> findOptions(
            @RequestHeader(ORGANIZATION_ID) UUID organizationId,
            @RequestParam(required = false) FinancialPartyRole role) {

        return ResponseEntity.ok(service.findFinancialPartyOptions(organizationId, role));
    }

    @GetMapping("/{id}")
    public ResponseEntity<BeneficiaryResponse> findById(
            @RequestHeader(ORGANIZATION_ID) UUID organizationId,
            @PathVariable UUID id) {

        return ResponseEntity.ok(service.findFinancialPartyById(id, organizationId));
    }

    @PutMapping("/{id}")
    public ResponseEntity<BeneficiaryResponse> update(
            @RequestHeader(ORGANIZATION_ID) UUID organizationId,
            @PathVariable UUID id,
            @RequestBody @Valid UpdateBeneficiaryRequest request) {

        return ResponseEntity.ok(service.update(organizationId, id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deactivate(
            @RequestHeader(ORGANIZATION_ID) UUID organizationId,
            @PathVariable UUID id) {

        service.delete(id, organizationId);

        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/activate")
    public ResponseEntity<BeneficiaryResponse> activate(
            @RequestHeader(ORGANIZATION_ID) UUID organizationId,
            @PathVariable UUID id) {

        return ResponseEntity.ok(service.activate(
                organizationId,
                id));
    }
}
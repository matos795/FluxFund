package com.fluxfund.api.domain.fund.controller;

import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
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
import org.springframework.web.bind.annotation.RestController;

import com.fluxfund.api.domain.fund.dto.CreateFundRequest;
import com.fluxfund.api.domain.fund.dto.FundResponse;
import com.fluxfund.api.domain.fund.dto.UpdateFundRequest;
import com.fluxfund.api.domain.fund.service.FundService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import static com.fluxfund.api.security.TenantHeaders.ORGANIZATION_ID;

@RestController
@RequestMapping("/api/v1/funds")
@RequiredArgsConstructor
public class FundController {

    private final FundService service;

    @PostMapping
    public ResponseEntity<FundResponse> create(
            @RequestHeader(ORGANIZATION_ID) UUID organizationId,
            @RequestBody @Valid CreateFundRequest request) {

        FundResponse response = service.create(request, organizationId);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(response);
    }

    @GetMapping
    public ResponseEntity<Page<FundResponse>> findAll(
            @RequestHeader(ORGANIZATION_ID) UUID organizationId,
            Pageable pageable) {

        return ResponseEntity.ok(
                service.findAll(organizationId, pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<FundResponse> findById(
            @RequestHeader(ORGANIZATION_ID) UUID organizationId,
            @PathVariable UUID id) {

        return ResponseEntity.ok(service.findById(id, organizationId));
    }

    @PutMapping("/{id}")
    public ResponseEntity<FundResponse> update(
            @RequestHeader(ORGANIZATION_ID) UUID organizationId,
            @PathVariable UUID id,
            @RequestBody @Valid UpdateFundRequest request) {

        return ResponseEntity.ok(
                service.update(id, organizationId, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @RequestHeader(ORGANIZATION_ID) UUID organizationId,
            @PathVariable UUID id) {

        service.delete(id, organizationId);

        return ResponseEntity.noContent().build();
    }
}
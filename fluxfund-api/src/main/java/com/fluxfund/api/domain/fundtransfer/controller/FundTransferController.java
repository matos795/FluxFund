package com.fluxfund.api.domain.fundtransfer.controller;

import static com.fluxfund.api.security.TenantHeaders.ORGANIZATION_ID;

import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.fluxfund.api.domain.fundtransfer.dto.CreateFundTransferRequest;
import com.fluxfund.api.domain.fundtransfer.dto.FundTransferResponse;
import com.fluxfund.api.domain.fundtransfer.service.FundTransferService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/fund-transfers")
@RequiredArgsConstructor
public class FundTransferController {

    private final FundTransferService service;

    @PostMapping
    public ResponseEntity<FundTransferResponse> create(
            @RequestHeader(ORGANIZATION_ID) UUID organizationId,
            @RequestBody @Valid CreateFundTransferRequest request) {

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(service.create(organizationId, request));
    }

    @GetMapping
    public ResponseEntity<Page<FundTransferResponse>> findAll(
            @RequestHeader(ORGANIZATION_ID) UUID organizationId,
            Pageable pageable) {

        return ResponseEntity.ok(service.findAll(organizationId, pageable));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> cancel(
            @RequestHeader(ORGANIZATION_ID) UUID organizationId,
            @PathVariable UUID id) {

        service.cancel(organizationId, id);
        return ResponseEntity.noContent().build();
    }
}
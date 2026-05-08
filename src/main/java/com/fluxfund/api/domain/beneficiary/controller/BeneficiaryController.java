package com.fluxfund.api.domain.beneficiary.controller;

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
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.fluxfund.api.domain.beneficiary.dto.BeneficiaryResponse;
import com.fluxfund.api.domain.beneficiary.dto.CreateBeneficiaryRequest;
import com.fluxfund.api.domain.beneficiary.dto.UpdateBeneficiaryRequest;
import com.fluxfund.api.domain.beneficiary.service.BeneficiaryService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/beneficiaries")
@RequiredArgsConstructor
public class BeneficiaryController {

    private final BeneficiaryService service;

    @PostMapping
    public ResponseEntity<BeneficiaryResponse> create(
            @RequestBody @Valid CreateBeneficiaryRequest request) {

        BeneficiaryResponse response = service.create(request);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(response);
    }

    @GetMapping
    public ResponseEntity<Page<BeneficiaryResponse>> findAll(
            @RequestParam UUID organizationId,
            Pageable pageable) {

        return ResponseEntity.ok(
                service.findAll(organizationId, pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<BeneficiaryResponse> findById(
            @PathVariable UUID id) {

        return ResponseEntity.ok(service.findById(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<BeneficiaryResponse> update(
            @PathVariable UUID id,
            @RequestBody @Valid UpdateBeneficiaryRequest request) {

        return ResponseEntity.ok(
                service.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @PathVariable UUID id) {

        service.delete(id);

        return ResponseEntity.noContent().build();
    }
}
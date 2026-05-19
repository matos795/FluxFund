package com.fluxfund.api.domain.financialtransaction.controller;

import java.time.LocalDate;
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

import com.fluxfund.api.domain.financialtransaction.FinancialTransactionStatus;
import com.fluxfund.api.domain.financialtransaction.FinancialTransactionType;
import com.fluxfund.api.domain.financialtransaction.dto.ClassifyFinancialTransactionRequest;
import com.fluxfund.api.domain.financialtransaction.dto.CreateFinancialTransactionRequest;
import com.fluxfund.api.domain.financialtransaction.dto.FinancialTransactionResponse;
import com.fluxfund.api.domain.financialtransaction.dto.UpdateFinancialTransactionRequest;
import com.fluxfund.api.domain.financialtransaction.service.FinancialTransactionService;
import com.fluxfund.api.domain.transactionallocation.dto.CreateTransactionAllocationRequest;
import com.fluxfund.api.domain.transactionallocation.dto.TransactionAllocationResponse;
import com.fluxfund.api.domain.transactionallocation.dto.UpdateTransactionAllocationRequest;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/financial-transactions")
@RequiredArgsConstructor
public class FinancialTransactionController {
        private final FinancialTransactionService service;

        @PostMapping
        public ResponseEntity<FinancialTransactionResponse> create(
                        @RequestParam UUID organizationId,
                        @RequestBody @Valid CreateFinancialTransactionRequest request) {

                FinancialTransactionResponse response = service.create(organizationId, request);

                return ResponseEntity.status(HttpStatus.CREATED)
                                .body(response);
        }

        @GetMapping
        public ResponseEntity<Page<FinancialTransactionResponse>> findAll(
                        @RequestParam UUID organizationId,
                        @RequestParam(required = false) FinancialTransactionType type,
                        @RequestParam(required = false) FinancialTransactionStatus status,
                        @RequestParam(required = false) UUID accountId,
                        @RequestParam(required = false) UUID categoryId,
                        @RequestParam(required = false) String description,
                        @RequestParam(required = false) LocalDate settlementDateFrom,
                        @RequestParam(required = false) LocalDate settlementDateTo,
                        Pageable pageable) {

                return ResponseEntity.ok(
                                service.findAll(organizationId,
                                                type,
                                                status,
                                                accountId,
                                                categoryId,
                                                description,
                                                settlementDateFrom,
                                                settlementDateTo,
                                                pageable));
        }

        @GetMapping("/{id}")
        public ResponseEntity<FinancialTransactionResponse> findById(
                        @RequestParam UUID organizationId,
                        @PathVariable UUID id) {

                return ResponseEntity.ok(service.findById(organizationId, id));
        }

        @PutMapping("/{id}")
        public ResponseEntity<FinancialTransactionResponse> update(
                        @RequestParam UUID organizationId,
                        @PathVariable UUID id,
                        @RequestBody @Valid UpdateFinancialTransactionRequest request) {

                return ResponseEntity.ok(
                                service.update(organizationId, id, request));
        }

        @DeleteMapping("/{id}")
        public ResponseEntity<Void> delete(
                        @RequestParam UUID organizationId,
                        @PathVariable UUID id) {

                service.delete(organizationId, id);

                return ResponseEntity.noContent().build();
        }

        @PostMapping("/{id}/allocations")
        public ResponseEntity<TransactionAllocationResponse> addAllocation(
                        @RequestParam UUID organizationId,
                        @PathVariable UUID id,
                        @RequestBody @Valid CreateTransactionAllocationRequest request) {

                return ResponseEntity.status(HttpStatus.CREATED)
                                .body(service.addAllocation(organizationId, id, request));
        }

        @PutMapping("/{id}/allocations/{allocationId}")
        public ResponseEntity<TransactionAllocationResponse> updateAllocation(
                        @RequestParam UUID organizationId,
                        @PathVariable UUID id,
                        @PathVariable UUID allocationId,
                        @RequestBody @Valid UpdateTransactionAllocationRequest request) {

                return ResponseEntity.ok(
                                service.updateAllocation(organizationId, id, allocationId, request));
        }

        @DeleteMapping("/{id}/allocations/{allocationId}")
        public ResponseEntity<Void> removeAllocation(
                        @RequestParam UUID organizationId,
                        @PathVariable UUID id,
                        @PathVariable UUID allocationId) {

                service.removeAllocation(organizationId, id, allocationId);
                return ResponseEntity.noContent().build();
        }

        @PutMapping("/{id}/classify")
        public ResponseEntity<FinancialTransactionResponse> classify(
                        @RequestParam UUID organizationId,
                        @PathVariable UUID id,
                        @RequestBody @Valid ClassifyFinancialTransactionRequest request) {

                return ResponseEntity.ok(
                                service.classify(organizationId, id, request));
        }
}

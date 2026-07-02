package com.fluxfund.api.domain.financialtransaction.controller;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
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
import org.springframework.web.multipart.MultipartFile;

import com.fluxfund.api.domain.financialtransaction.FinancialTransactionSource;
import com.fluxfund.api.domain.financialtransaction.FinancialTransactionStatus;
import com.fluxfund.api.domain.financialtransaction.FinancialTransactionType;
import com.fluxfund.api.domain.financialtransaction.dto.ClassifyFinancialTransactionRequest;
import com.fluxfund.api.domain.financialtransaction.dto.CreateAccountTransferRequest;
import com.fluxfund.api.domain.financialtransaction.dto.CreateFinancialTransactionRequest;
import com.fluxfund.api.domain.financialtransaction.dto.FinancialTransactionClassificationSuggestionResponse;
import com.fluxfund.api.domain.financialtransaction.dto.FinancialTransactionResponse;
import com.fluxfund.api.domain.financialtransaction.dto.ImportOfxResponse;
import com.fluxfund.api.domain.financialtransaction.dto.UpdateFinancialTransactionRequest;
import com.fluxfund.api.domain.financialtransaction.export.FinancialTransactionExcelExportService;
import com.fluxfund.api.domain.financialtransaction.service.FinancialTransactionCsvImportService;
import com.fluxfund.api.domain.financialtransaction.service.FinancialTransactionService;
import com.fluxfund.api.domain.financialtransaction.service.OfxImportService;
import com.fluxfund.api.domain.transactionallocation.dto.CreateTransactionAllocationBatchRequest;
import com.fluxfund.api.domain.transactionallocation.dto.CreateTransactionAllocationRequest;
import com.fluxfund.api.domain.transactionallocation.dto.TransactionAllocationResponse;
import com.fluxfund.api.domain.transactionallocation.dto.UpdateTransactionAllocationRequest;
import com.fluxfund.api.shared.importer.ImportProfile;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import static com.fluxfund.api.security.TenantHeaders.ORGANIZATION_ID;

@RestController
@RequestMapping("/api/v1/financial-transactions")
@RequiredArgsConstructor
public class FinancialTransactionController {
        private final FinancialTransactionService service;
        private final OfxImportService ofxImportService;
        private final FinancialTransactionExcelExportService excelExportService;
        private final FinancialTransactionCsvImportService csvImportService;

        @PostMapping
        public ResponseEntity<FinancialTransactionResponse> create(
                        @RequestHeader(ORGANIZATION_ID) UUID organizationId,
                        @RequestBody @Valid CreateFinancialTransactionRequest request) {

                FinancialTransactionResponse response = service.create(organizationId, request);

                return ResponseEntity.status(HttpStatus.CREATED)
                                .body(response);
        }

        @GetMapping
        public ResponseEntity<Page<FinancialTransactionResponse>> findAll(
                        @RequestHeader(ORGANIZATION_ID) UUID organizationId,
                        @RequestParam(required = false) FinancialTransactionType type,
                        @RequestParam(required = false) FinancialTransactionStatus status,
                        @RequestParam(required = false) FinancialTransactionSource source,
                        @RequestParam(required = false) UUID accountId,
                        @RequestParam(required = false) UUID categoryId,
                        @RequestParam(required = false) String description,
                        @RequestParam(required = false) LocalDate settlementDateFrom,
                        @RequestParam(required = false) LocalDate settlementDateTo,
                        @RequestParam(required = false) Boolean onlyUnclassified,
                        @RequestParam(required = false) Boolean onlyUnallocated,
                        @RequestParam(required = false) UUID fundId,
                        Pageable pageable) {

                return ResponseEntity.ok(
                                service.findAll(organizationId,
                                                type,
                                                status,
                                                source,
                                                accountId,
                                                categoryId,
                                                description,
                                                settlementDateFrom,
                                                settlementDateTo,
                                                onlyUnclassified,
                                                onlyUnallocated,
                                                fundId,
                                                pageable));
        }

        @GetMapping("/{id}/classification-suggestion")
        public ResponseEntity<FinancialTransactionClassificationSuggestionResponse> getClassificationSuggestion(
                        @RequestHeader(ORGANIZATION_ID) UUID organizationId,
                        @PathVariable UUID id) {

                return ResponseEntity.ok(
                                service.getClassificationSuggestion(organizationId, id));
        }

        @GetMapping("/{id}")
        public ResponseEntity<FinancialTransactionResponse> findById(
                        @RequestHeader(ORGANIZATION_ID) UUID organizationId,
                        @PathVariable UUID id) {

                return ResponseEntity.ok(service.findById(organizationId, id));
        }

        @PutMapping("/{id}")
        public ResponseEntity<FinancialTransactionResponse> update(
                        @RequestHeader(ORGANIZATION_ID) UUID organizationId,
                        @PathVariable UUID id,
                        @RequestBody @Valid UpdateFinancialTransactionRequest request) {

                return ResponseEntity.ok(
                                service.update(organizationId, id, request));
        }

        @DeleteMapping("/{id}")
        public ResponseEntity<Void> delete(
                        @RequestHeader(ORGANIZATION_ID) UUID organizationId,
                        @PathVariable UUID id) {

                service.delete(organizationId, id);

                return ResponseEntity.noContent().build();
        }

        @PostMapping("/{id}/allocations")
        public ResponseEntity<TransactionAllocationResponse> addAllocation(
                        @RequestHeader(ORGANIZATION_ID) UUID organizationId,
                        @PathVariable UUID id,
                        @RequestBody @Valid CreateTransactionAllocationRequest request) {

                return ResponseEntity.status(HttpStatus.CREATED)
                                .body(service.addAllocation(organizationId, id, request));
        }

        @PostMapping("/{id}/allocations/batch")
        public ResponseEntity<List<TransactionAllocationResponse>> addAllocationsBatch(
                        @RequestHeader(ORGANIZATION_ID) UUID organizationId,
                        @PathVariable UUID id,
                        @RequestBody @Valid CreateTransactionAllocationBatchRequest request) {

                return ResponseEntity.status(HttpStatus.CREATED)
                                .body(service.addAllocationsBatch(
                                                organizationId,
                                                id,
                                                request.allocations()));
        }

        @PutMapping("/{id}/allocations/{allocationId}")
        public ResponseEntity<TransactionAllocationResponse> updateAllocation(
                        @RequestHeader(ORGANIZATION_ID) UUID organizationId,
                        @PathVariable UUID id,
                        @PathVariable UUID allocationId,
                        @RequestBody @Valid UpdateTransactionAllocationRequest request) {

                return ResponseEntity.ok(
                                service.updateAllocation(organizationId, id, allocationId, request));
        }

        @DeleteMapping("/{id}/allocations/{allocationId}")
        public ResponseEntity<Void> removeAllocation(
                        @RequestHeader(ORGANIZATION_ID) UUID organizationId,
                        @PathVariable UUID id,
                        @PathVariable UUID allocationId) {

                service.removeAllocation(organizationId, id, allocationId);
                return ResponseEntity.noContent().build();
        }

        @PutMapping("/{id}/classify")
        public ResponseEntity<FinancialTransactionResponse> classify(
                        @RequestHeader(ORGANIZATION_ID) UUID organizationId,
                        @PathVariable UUID id,
                        @RequestBody @Valid ClassifyFinancialTransactionRequest request) {

                return ResponseEntity.ok(
                                service.classify(organizationId, id, request));
        }

        @PostMapping(value = "/import/ofx", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
        public ResponseEntity<ImportOfxResponse> importOfx(
                        @RequestHeader(ORGANIZATION_ID) UUID organizationId,
                        @RequestParam UUID accountId,
                        @RequestParam MultipartFile file) {
                return ResponseEntity.ok(
                                ofxImportService.importOfx(organizationId, accountId, file));
        }

        @GetMapping("/{transactionId}/allocations")
        public List<TransactionAllocationResponse> findAllByTransaction(
                        @RequestHeader(ORGANIZATION_ID) UUID organizationId,
                        @PathVariable UUID transactionId) {
                return service.findAllByTransaction(organizationId, transactionId);
        }

        @GetMapping("/export/settled.xlsx")
        public ResponseEntity<byte[]> exportSettledTransactionsExcel(
                        @RequestHeader(ORGANIZATION_ID) UUID organizationId,
                        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
                        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
                byte[] file = excelExportService.exportSettledTransactions(
                                organizationId,
                                startDate,
                                endDate);

                String filename = "movimento-financeiro.xlsx";

                return ResponseEntity.ok()
                                .contentType(MediaType.parseMediaType(
                                                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                                .header(
                                                HttpHeaders.CONTENT_DISPOSITION,
                                                ContentDisposition.attachment()
                                                                .filename(filename)
                                                                .build()
                                                                .toString())
                                .body(file);
        }

        @PostMapping(value = "/import/csv", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
        public ResponseEntity<ImportOfxResponse> importCsv(
                        @RequestHeader(ORGANIZATION_ID) UUID organizationId,
                        @RequestParam UUID accountId,
                        @RequestParam ImportProfile profile,
                        @RequestParam MultipartFile file) {

                return ResponseEntity.ok(
                                csvImportService.importCsv(organizationId, accountId, profile, file));
        }

        @PostMapping("/transfers")
        public ResponseEntity<List<FinancialTransactionResponse>> createAccountTransfer(
                        @RequestHeader(ORGANIZATION_ID) UUID organizationId,
                        @RequestBody @Valid CreateAccountTransferRequest request) {

                return ResponseEntity.status(HttpStatus.CREATED)
                                .body(service.createAccountTransfer(organizationId, request));
        }

        @DeleteMapping("/{id}/transfer")
        public ResponseEntity<Void> cancelAccountTransfer(
                        @RequestHeader(ORGANIZATION_ID) UUID organizationId,
                        @PathVariable UUID id) {

                service.cancelAccountTransfer(organizationId, id);
                return ResponseEntity.noContent().build();
        }
}

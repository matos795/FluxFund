package com.fluxfund.api.domain.creditcardstatement.controller;

import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.Sort;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import com.fluxfund.api.domain.creditcardstatement.CreditCardStatementStatus;
import com.fluxfund.api.domain.creditcardstatement.dto.CreateCreditCardItemRequest;
import com.fluxfund.api.domain.creditcardstatement.dto.CreateCreditCardStatementRequest;
import com.fluxfund.api.domain.creditcardstatement.dto.CreditCardStatementDocumentFile;
import com.fluxfund.api.domain.creditcardstatement.dto.CreditCardStatementDocumentResponse;
import com.fluxfund.api.domain.creditcardstatement.dto.CreditCardStatementImportResponse;
import com.fluxfund.api.domain.creditcardstatement.dto.CreditCardStatementLibraryResponse;
import com.fluxfund.api.domain.creditcardstatement.dto.CreditCardStatementPaymentResponse;
import com.fluxfund.api.domain.creditcardstatement.dto.CreditCardStatementResponse;
import com.fluxfund.api.domain.creditcardstatement.dto.LinkCreditCardStatementPaymentRequest;
import com.fluxfund.api.domain.creditcardstatement.dto.PayCreditCardStatementRequest;
import com.fluxfund.api.domain.creditcardstatement.dto.UpdateCreditCardStatementRequest;
import com.fluxfund.api.domain.creditcardstatement.service.CreditCardStatementDocumentService;
import com.fluxfund.api.domain.creditcardstatement.service.CreditCardStatementOfxImportService;
import com.fluxfund.api.domain.creditcardstatement.service.CreditCardStatementService;
import com.fluxfund.api.domain.creditcardstatement.service.CreditCardStatementSpreadsheetImportService;
import com.fluxfund.api.domain.financialtransaction.dto.FinancialTransactionResponse;
import com.fluxfund.api.shared.importer.ImportProfile;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import static com.fluxfund.api.security.TenantHeaders.ORGANIZATION_ID;

@RestController
@RequestMapping("/api/v1/credit-card-statements")
@RequiredArgsConstructor
public class CreditCardStatementController {

        private final CreditCardStatementService service;
        private final CreditCardStatementOfxImportService ofxImportService;
        private final CreditCardStatementSpreadsheetImportService spreadsheetImportService;
        private final CreditCardStatementDocumentService documentService;

        @PostMapping
        public ResponseEntity<CreditCardStatementResponse> create(
                        @RequestHeader(ORGANIZATION_ID) UUID organizationId,
                        @RequestBody @Valid CreateCreditCardStatementRequest request) {

                return ResponseEntity.status(HttpStatus.CREATED)
                                .body(service.create(organizationId, request));
        }

        @GetMapping
        public ResponseEntity<Page<CreditCardStatementResponse>> findAll(
                        @RequestHeader(ORGANIZATION_ID) UUID organizationId,
                        @RequestParam(required = false) UUID creditCardAccountId,
                        @RequestParam(required = false) CreditCardStatementStatus status,
                        Pageable pageable) {

                return ResponseEntity.ok(
                                service.findAll(organizationId, creditCardAccountId, status, pageable));
        }

        @GetMapping("/library")
        public Page<CreditCardStatementLibraryResponse> findDocumentsForLibrary(
                        @RequestHeader(ORGANIZATION_ID) UUID organizationId,
                        @RequestParam(required = false) UUID accountId,
                        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate periodStartDate,
                        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate periodEndDate,
                        @RequestParam(required = false) String filename,

                        @PageableDefault(size = 20, sort = {
                                        "dueDate",
                                        "statementPdfUploadedAt"
                        }, direction = Sort.Direction.DESC) Pageable pageable) {

                return documentService.findAllForLibrary(
                                organizationId,
                                accountId,
                                periodStartDate,
                                periodEndDate,
                                filename,
                                pageable);
        }

        @GetMapping("/{id}")
        public ResponseEntity<CreditCardStatementResponse> findById(
                        @RequestHeader(ORGANIZATION_ID) UUID organizationId,
                        @PathVariable UUID id) {

                return ResponseEntity.ok(service.findById(organizationId, id));
        }

        @PutMapping("/{id}")
        public ResponseEntity<CreditCardStatementResponse> update(
                        @RequestHeader(ORGANIZATION_ID) UUID organizationId,
                        @PathVariable UUID id,
                        @RequestBody @Valid UpdateCreditCardStatementRequest request) {

                return ResponseEntity.ok(service.update(organizationId, id, request));
        }

        @DeleteMapping("/{id}")
        public ResponseEntity<Void> cancel(
                        @RequestHeader(ORGANIZATION_ID) UUID organizationId,
                        @PathVariable UUID id) {

                service.cancel(organizationId, id);
                return ResponseEntity.noContent().build();
        }

        @PostMapping("/{id}/items")
        public ResponseEntity<FinancialTransactionResponse> addItem(
                        @RequestHeader(ORGANIZATION_ID) UUID organizationId,
                        @PathVariable UUID id,
                        @RequestBody @Valid CreateCreditCardItemRequest request) {

                return ResponseEntity.status(HttpStatus.CREATED)
                                .body(service.addItem(organizationId, id, request));
        }

        @PostMapping("/{id}/pay")
        public ResponseEntity<CreditCardStatementResponse> pay(
                        @RequestHeader(ORGANIZATION_ID) UUID organizationId,
                        @PathVariable UUID id,
                        @RequestBody @Valid PayCreditCardStatementRequest request) {

                return ResponseEntity.ok(service.pay(organizationId, id, request));
        }

        @GetMapping("/{id}/payments")
        public ResponseEntity<List<CreditCardStatementPaymentResponse>> findPayments(
                        @RequestHeader(ORGANIZATION_ID) UUID organizationId,
                        @PathVariable UUID id) {

                return ResponseEntity.ok(service.findPayments(organizationId, id));
        }

        @PostMapping({ "/{id}/import-ofx", "/{id}/import/ofx" })
        public ResponseEntity<CreditCardStatementImportResponse> importOfx(
                        @RequestHeader(ORGANIZATION_ID) UUID organizationId,
                        @PathVariable UUID id,
                        @RequestParam("file") MultipartFile file) {

                return ResponseEntity.status(HttpStatus.CREATED)
                                .body(ofxImportService.importOfx(organizationId, id, file));
        }

        @GetMapping("/{id}/items")
        public ResponseEntity<List<FinancialTransactionResponse>> findItems(
                        @RequestHeader(ORGANIZATION_ID) UUID organizationId,
                        @PathVariable UUID id) {

                return ResponseEntity.ok(service.findItems(organizationId, id));
        }

        @PostMapping(value = "/{id}/import/file", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
        public ResponseEntity<CreditCardStatementImportResponse> importFile(
                        @RequestHeader(ORGANIZATION_ID) UUID organizationId,
                        @PathVariable UUID id,
                        @RequestParam ImportProfile profile,
                        @RequestParam("file") MultipartFile file) {

                return ResponseEntity.status(HttpStatus.CREATED)
                                .body(spreadsheetImportService.importFile(
                                                organizationId,
                                                id,
                                                profile,
                                                file));
        }

        @PostMapping(value = "/{id}/document", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
        public ResponseEntity<CreditCardStatementDocumentResponse> uploadDocument(
                        @RequestHeader(ORGANIZATION_ID) UUID organizationId,
                        @PathVariable UUID id,
                        @RequestParam("file") MultipartFile file) {

                return ResponseEntity.status(HttpStatus.CREATED)
                                .body(documentService.upload(
                                                organizationId,
                                                id,
                                                file));
        }

        @GetMapping("/{id}/document/download")
        public ResponseEntity<byte[]> downloadDocument(
                        @RequestHeader(ORGANIZATION_ID) UUID organizationId,
                        @PathVariable UUID id) {

                CreditCardStatementDocumentFile file = documentService.download(
                                organizationId,
                                id);

                return ResponseEntity.ok()
                                .contentType(MediaType.parseMediaType(file.contentType()))
                                .header(
                                                HttpHeaders.CONTENT_DISPOSITION,
                                                ContentDisposition.attachment()
                                                                .filename(
                                                                                file.filename(),
                                                                                StandardCharsets.UTF_8)
                                                                .build()
                                                                .toString())
                                .header("X-Content-Type-Options", "nosniff")
                                .body(file.content());
        }

        @DeleteMapping("/{id}/document")
        public ResponseEntity<Void> deleteDocument(
                        @RequestHeader(ORGANIZATION_ID) UUID organizationId,
                        @PathVariable UUID id) {

                documentService.delete(organizationId, id);

                return ResponseEntity.noContent().build();
        }

        @PostMapping("/{statementId}/payments/{paymentId}/link")
        public ResponseEntity<CreditCardStatementPaymentResponse> linkPayment(
                        @RequestHeader(ORGANIZATION_ID) UUID organizationId,
                        @PathVariable UUID statementId,
                        @PathVariable UUID paymentId,
                        @RequestBody @Valid LinkCreditCardStatementPaymentRequest request) {

                return ResponseEntity.ok(
                                service.linkPayment(
                                                organizationId,
                                                statementId,
                                                paymentId,
                                                request));
        }

        @PostMapping("/{statementId}/payments/{paymentId}/opening-balance")
        public ResponseEntity<CreditCardStatementPaymentResponse> markPaymentAsOpeningBalance(
                        @RequestHeader(ORGANIZATION_ID) UUID organizationId,
                        @PathVariable UUID statementId,
                        @PathVariable UUID paymentId) {

                return ResponseEntity.ok(
                                service.markPaymentAsOpeningBalance(
                                                organizationId,
                                                statementId,
                                                paymentId));
        }
}
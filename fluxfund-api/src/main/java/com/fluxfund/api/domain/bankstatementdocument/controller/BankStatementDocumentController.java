package com.fluxfund.api.domain.bankstatementdocument.controller;

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
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.fluxfund.api.domain.bankstatementdocument.dto.BankStatementDocumentFile;
import com.fluxfund.api.domain.bankstatementdocument.dto.BankStatementDocumentResponse;
import com.fluxfund.api.domain.bankstatementdocument.service.BankStatementDocumentService;

import lombok.RequiredArgsConstructor;

import static com.fluxfund.api.security.TenantHeaders.ORGANIZATION_ID;

@RestController
@RequestMapping("/api/v1/bank-statement-documents")
@RequiredArgsConstructor
public class BankStatementDocumentController {

        private final BankStatementDocumentService service;

        @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
        @ResponseStatus(HttpStatus.CREATED)
        public BankStatementDocumentResponse upload(
                        @RequestHeader(ORGANIZATION_ID) UUID organizationId,
                        @RequestParam UUID accountId,
                        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate periodStartDate,
                        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate periodEndDate,
                        @RequestParam MultipartFile file) {

                return service.upload(
                                organizationId,
                                accountId,
                                periodStartDate,
                                periodEndDate,
                                file);
        }

        @GetMapping
        public List<BankStatementDocumentResponse> findAllForAccountAndPeriod(
                        @RequestHeader(ORGANIZATION_ID) UUID organizationId,
                        @RequestParam UUID accountId,
                        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate periodStartDate,
                        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate periodEndDate) {

                return service.findAllForAccountAndPeriod(
                                organizationId,
                                accountId,
                                periodStartDate,
                                periodEndDate);
        }

        @GetMapping("/library")
        public Page<BankStatementDocumentResponse> findAll(
                        @RequestHeader(ORGANIZATION_ID) UUID organizationId,
                        @RequestParam(required = false) UUID accountId,
                        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate periodStartDate,
                        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate periodEndDate,
                        @RequestParam(required = false) String filename,

                        @PageableDefault(size = 20, sort = {
                                        "periodStartDate",
                                        "uploadedAt"
                        }, direction = Sort.Direction.DESC) Pageable pageable) {

                return service.findAll(
                                organizationId,
                                accountId,
                                periodStartDate,
                                periodEndDate,
                                filename,
                                pageable);
        }

        @GetMapping("/{documentId}/download")
        public ResponseEntity<byte[]> download(
                        @RequestHeader(ORGANIZATION_ID) UUID organizationId,
                        @PathVariable UUID documentId) {

                BankStatementDocumentFile file = service.download(organizationId, documentId);

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

        @DeleteMapping("/{documentId}")
        @ResponseStatus(HttpStatus.NO_CONTENT)
        public void delete(
                        @RequestHeader(ORGANIZATION_ID) UUID organizationId,
                        @PathVariable UUID documentId) {

                service.delete(organizationId, documentId);
        }
}
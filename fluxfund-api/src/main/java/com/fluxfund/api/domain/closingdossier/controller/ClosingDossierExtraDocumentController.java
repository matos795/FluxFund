package com.fluxfund.api.domain.closingdossier.controller;

import static com.fluxfund.api.security.TenantHeaders.ORGANIZATION_ID;

import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

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

import com.fluxfund.api.domain.closingdossier.ClosingDossierExtraDocumentType;
import com.fluxfund.api.domain.closingdossier.dto.ClosingDossierExtraDocumentFile;
import com.fluxfund.api.domain.closingdossier.dto.ClosingDossierExtraDocumentResponse;
import com.fluxfund.api.domain.closingdossier.service.ClosingDossierExtraDocumentService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/closing-dossier-extra-documents")
@RequiredArgsConstructor
public class ClosingDossierExtraDocumentController {

    private final ClosingDossierExtraDocumentService service;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    public ClosingDossierExtraDocumentResponse upload(
            @RequestHeader(ORGANIZATION_ID) UUID organizationId,
            @RequestParam
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate periodStartDate,
            @RequestParam
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate periodEndDate,
            @RequestParam ClosingDossierExtraDocumentType documentType,
            @RequestParam String title,
            @RequestParam(required = false) Integer sortOrder,
            @RequestParam MultipartFile file) {

        return service.upload(
                organizationId,
                periodStartDate,
                periodEndDate,
                documentType,
                title,
                sortOrder,
                file);
    }

    @GetMapping
    public List<ClosingDossierExtraDocumentResponse> findAllForPeriod(
            @RequestHeader(ORGANIZATION_ID) UUID organizationId,
            @RequestParam
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate periodStartDate,
            @RequestParam
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate periodEndDate) {

        return service.findAllForPeriod(
                organizationId,
                periodStartDate,
                periodEndDate);
    }

    @GetMapping("/{documentId}/download")
    public ResponseEntity<byte[]> download(
            @RequestHeader(ORGANIZATION_ID) UUID organizationId,
            @PathVariable UUID documentId) {

        ClosingDossierExtraDocumentFile file = service.download(
                organizationId,
                documentId);

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
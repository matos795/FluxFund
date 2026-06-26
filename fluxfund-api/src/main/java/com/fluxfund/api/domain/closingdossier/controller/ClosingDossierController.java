package com.fluxfund.api.domain.closingdossier.controller;

import java.nio.charset.StandardCharsets;
import java.util.UUID;

import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.fluxfund.api.domain.closingdossier.dto.ClosingDossierPreviewRequest;
import com.fluxfund.api.domain.closingdossier.dto.ClosingDossierPreviewResponse;
import com.fluxfund.api.domain.closingdossier.service.ClosingDossierExportService;
import com.fluxfund.api.domain.closingdossier.service.ClosingDossierService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import static com.fluxfund.api.security.TenantHeaders.ORGANIZATION_ID;

@RestController
@RequestMapping("/api/v1/reports/closing-dossier")
@RequiredArgsConstructor
public class ClosingDossierController {

    private final ClosingDossierService service;
    private final ClosingDossierExportService exportService;

    @PostMapping("/preview")
    public ResponseEntity<ClosingDossierPreviewResponse> preview(
            @RequestHeader(ORGANIZATION_ID) UUID organizationId,
            @Valid @RequestBody ClosingDossierPreviewRequest request) {

        return ResponseEntity.ok(
                service.preview(organizationId, request));
    }

    @PostMapping(value = "/export.pdf", produces = MediaType.APPLICATION_PDF_VALUE)
    public ResponseEntity<byte[]> exportPdf(
            @RequestHeader(ORGANIZATION_ID) UUID organizationId,
            @Valid @RequestBody ClosingDossierPreviewRequest request) {

        byte[] pdf = exportService.export(organizationId, request);

        String filename = "dossie-fechamento-%s-a-%s.pdf"
                .formatted(
                        request.periodStartDate(),
                        request.periodEndDate());

        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(
                        HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.attachment()
                                .filename(
                                        filename,
                                        StandardCharsets.UTF_8)
                                .build()
                                .toString())
                .body(pdf);
    }
}
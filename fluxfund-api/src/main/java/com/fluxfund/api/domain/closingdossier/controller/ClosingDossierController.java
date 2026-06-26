package com.fluxfund.api.domain.closingdossier.controller;

import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.fluxfund.api.domain.closingdossier.dto.ClosingDossierPreviewRequest;
import com.fluxfund.api.domain.closingdossier.dto.ClosingDossierPreviewResponse;
import com.fluxfund.api.domain.closingdossier.service.ClosingDossierService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import static com.fluxfund.api.security.TenantHeaders.ORGANIZATION_ID;

@RestController
@RequestMapping("/api/v1/reports/closing-dossier")
@RequiredArgsConstructor
public class ClosingDossierController {

    private final ClosingDossierService service;

    @PostMapping("/preview")
    public ResponseEntity<ClosingDossierPreviewResponse> preview(
            @RequestHeader(ORGANIZATION_ID) UUID organizationId,
            @Valid @RequestBody ClosingDossierPreviewRequest request) {

        return ResponseEntity.ok(
                service.preview(organizationId, request));
    }
}
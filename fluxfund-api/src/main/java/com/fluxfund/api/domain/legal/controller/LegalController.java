package com.fluxfund.api.domain.legal.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.fluxfund.api.domain.legal.service.LegalAcceptanceService;
import com.fluxfund.api.domain.legal.LegalAcceptanceStatus;
import com.fluxfund.api.domain.legal.service.LegalDocumentService;
import com.fluxfund.api.domain.legal.dto.LegalDocumentSnapshot;
import com.fluxfund.api.domain.legal.dto.AcceptLegalDocumentsRequest;
import com.fluxfund.api.domain.legal.dto.LegalAcceptanceStatusResponse;
import com.fluxfund.api.domain.legal.dto.LegalDocumentResponse;
import com.fluxfund.api.domain.legal.dto.LegalDocumentsResponse;
import com.fluxfund.api.domain.legal.dto.LegalDocumentProperties;
import com.fluxfund.api.shared.exception.ResourceNotFoundException;
import com.fluxfund.api.security.CurrentUserService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/legal")
@RequiredArgsConstructor
public class LegalController {

    private final LegalDocumentService documentService;

    private final LegalAcceptanceService acceptanceService;

    private final CurrentUserService currentUserService;

    private final LegalDocumentProperties properties;

    @GetMapping("/documents")
    public ResponseEntity<LegalDocumentsResponse> findCurrentDocuments() {

        if (!properties.enforcementEnabled()) {
            throw new ResourceNotFoundException(
                    "Legal documents are not available");
        }

        LegalDocumentSnapshot terms = documentService.currentTerms();

        LegalDocumentSnapshot privacy = documentService.currentPrivacyNotice();

        return ResponseEntity.ok(
                new LegalDocumentsResponse(
                        toResponse(terms),
                        toResponse(privacy)));
    }

    @GetMapping("/status")
    public ResponseEntity<LegalAcceptanceStatusResponse> findStatus() {

        var userId = currentUserService.requireUserId();

        LegalAcceptanceStatus status = acceptanceService.getStatus(userId);

        return ResponseEntity.ok(toResponse(status));
    }

    @PostMapping("/acceptance")
    public ResponseEntity<LegalAcceptanceStatusResponse> accept(
            @RequestBody @Valid AcceptLegalDocumentsRequest request) {

        var userId = currentUserService.requireUserId();

        LegalAcceptanceStatus status = acceptanceService.acceptCurrentDocuments(userId);

        return ResponseEntity.ok(toResponse(status));
    }

    private LegalDocumentResponse toResponse(LegalDocumentSnapshot document) {

        return new LegalDocumentResponse(
                document.version(),
                document.hash(),
                document.content());
    }

    private LegalAcceptanceStatusResponse toResponse(LegalAcceptanceStatus status) {

        return new LegalAcceptanceStatusResponse(
                status.enforcementEnabled(),
                status.acceptanceRequired(),
                status.termsVersion(),
                status.termsHash(),
                status.privacyNoticeVersion(),
                status.privacyNoticeHash(),
                status.acceptedAt());
    }
}
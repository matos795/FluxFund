package com.fluxfund.api.domain.legal.service;

import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.fluxfund.api.domain.legal.LegalAcceptanceStatus;
import com.fluxfund.api.domain.legal.dto.LegalDocumentSnapshot;
import com.fluxfund.api.domain.legal.repository.UserLegalAcceptanceRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class LegalAcceptanceService {

    private final UserLegalAcceptanceRepository acceptanceRepository;

    private final LegalDocumentService documentService;

    public LegalAcceptanceStatus getStatus(UUID userId) {

        LegalDocumentSnapshot terms = documentService.currentTerms();

        LegalDocumentSnapshot privacyNotice = documentService
                .currentPrivacyNotice();

        boolean accepted = acceptanceRepository
                .existsByUser_IdAndTermsVersionAndTermsHashAndPrivacyNoticeVersionAndPrivacyNoticeHash(
                        userId,
                        terms.version(),
                        terms.hash(),
                        privacyNotice.version(),
                        privacyNotice.hash());

        return new LegalAcceptanceStatus(
                !accepted,
                terms.version(),
                terms.hash(),
                privacyNotice.version(),
                privacyNotice.hash());
    }
}
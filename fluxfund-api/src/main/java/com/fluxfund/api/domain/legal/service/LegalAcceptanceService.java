package com.fluxfund.api.domain.legal.service;

import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.fluxfund.api.domain.legal.LegalAcceptanceStatus;
import com.fluxfund.api.domain.legal.dto.LegalDocumentSnapshot;
import com.fluxfund.api.domain.legal.repository.UserLegalAcceptanceRepository;
import com.fluxfund.api.domain.legal.UserLegalAcceptance;

import lombok.RequiredArgsConstructor;

import java.time.OffsetDateTime;

import com.fluxfund.api.domain.user.AppUser;
import com.fluxfund.api.domain.user.AppUserRepository;
import com.fluxfund.api.shared.exception.ResourceNotFoundException;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class LegalAcceptanceService {

    private final UserLegalAcceptanceRepository acceptanceRepository;
    private final LegalDocumentService documentService;
    private final AppUserRepository appUserRepository;

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

    @Transactional
    public LegalAcceptanceStatus acceptCurrentDocuments(UUID userId) {

        LegalDocumentSnapshot terms = documentService.currentTerms();

        LegalDocumentSnapshot privacyNotice = documentService.currentPrivacyNotice();

        boolean alreadyAccepted = acceptanceRepository
                .existsByUser_IdAndTermsVersionAndTermsHashAndPrivacyNoticeVersionAndPrivacyNoticeHash(
                        userId,
                        terms.version(),
                        terms.hash(),
                        privacyNotice.version(),
                        privacyNotice.hash());

        if (!alreadyAccepted) {

            AppUser user = appUserRepository
                    .findByIdAndActiveTrue(userId)
                    .orElseThrow(() -> new ResourceNotFoundException("User not found"));

            UserLegalAcceptance acceptance = new UserLegalAcceptance();
            acceptance.setUser(user);
            acceptance.setTermsVersion(terms.version());
            acceptance.setTermsHash(terms.hash());
            acceptance.setPrivacyNoticeVersion(privacyNotice.version());
            acceptance.setPrivacyNoticeHash(privacyNotice.hash());
            acceptance.setAcceptedAt(OffsetDateTime.now());

            acceptanceRepository.save(acceptance);
        }

        return new LegalAcceptanceStatus(
                false,
                terms.version(),
                terms.hash(),
                privacyNotice.version(),
                privacyNotice.hash());
    }
}
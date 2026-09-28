package com.fluxfund.api.domain.legal.service;

import java.time.OffsetDateTime;
import java.util.UUID;

import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.fluxfund.api.domain.legal.event.LegalAcceptanceRegisteredEvent;
import com.fluxfund.api.domain.legal.LegalAcceptanceStatus;
import com.fluxfund.api.domain.legal.UserLegalAcceptance;
import com.fluxfund.api.domain.legal.dto.LegalDocumentSnapshot;
import com.fluxfund.api.domain.legal.repository.UserLegalAcceptanceRepository;
import com.fluxfund.api.domain.user.AppUser;
import com.fluxfund.api.domain.user.AppUserRepository;
import com.fluxfund.api.shared.exception.ResourceNotFoundException;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class LegalAcceptanceService {

        private final UserLegalAcceptanceRepository acceptanceRepository;
        private final LegalDocumentService documentService;
        private final AppUserRepository appUserRepository;
        private final ApplicationEventPublisher eventPublisher;

        public LegalAcceptanceStatus getStatus(UUID userId) {

                LegalDocumentSnapshot terms = documentService.currentTerms();

                LegalDocumentSnapshot privacyNotice = documentService.currentPrivacyNotice();

                var currentAcceptance = acceptanceRepository
                                .findFirstByUser_IdAndTermsVersionAndTermsHashAndPrivacyNoticeVersionAndPrivacyNoticeHashOrderByAcceptedAtDesc(
                                                userId,
                                                terms.version(),
                                                terms.hash(),
                                                privacyNotice.version(),
                                                privacyNotice.hash());

                return new LegalAcceptanceStatus(
                                currentAcceptance.isEmpty(),
                                terms.version(),
                                terms.hash(),
                                privacyNotice.version(),
                                privacyNotice.hash(),
                                currentAcceptance
                                                .map(UserLegalAcceptance::getAcceptedAt)
                                                .orElse(null));
        }

        @Transactional
        public LegalAcceptanceStatus acceptCurrentDocuments(
                        UUID userId) {

                LegalDocumentSnapshot terms = documentService.currentTerms();

                LegalDocumentSnapshot privacyNotice = documentService.currentPrivacyNotice();

                var currentAcceptance = acceptanceRepository
                                .findFirstByUser_IdAndTermsVersionAndTermsHashAndPrivacyNoticeVersionAndPrivacyNoticeHashOrderByAcceptedAtDesc(
                                                userId,
                                                terms.version(),
                                                terms.hash(),
                                                privacyNotice.version(),
                                                privacyNotice.hash());

                if (currentAcceptance.isPresent()) {

                        return new LegalAcceptanceStatus(
                                        false,
                                        terms.version(),
                                        terms.hash(),
                                        privacyNotice.version(),
                                        privacyNotice.hash(),
                                        currentAcceptance
                                                        .get()
                                                        .getAcceptedAt());
                }

                AppUser user = appUserRepository
                                .findByIdAndActiveTrue(userId)
                                .orElseThrow(
                                                () -> new ResourceNotFoundException(
                                                                "User not found"));

                OffsetDateTime acceptedAt = OffsetDateTime.now();

                UserLegalAcceptance acceptance = new UserLegalAcceptance();

                acceptance.setUser(user);
                acceptance.setTermsVersion(
                                terms.version());
                acceptance.setTermsHash(
                                terms.hash());
                acceptance.setPrivacyNoticeVersion(
                                privacyNotice.version());
                acceptance.setPrivacyNoticeHash(
                                privacyNotice.hash());
                acceptance.setAcceptedAt(
                                acceptedAt);

                acceptanceRepository.save(acceptance);

                eventPublisher.publishEvent(
                                new LegalAcceptanceRegisteredEvent(
                                                user.getName(),
                                                user.getEmail(),
                                                terms.version(),
                                                privacyNotice.version(),
                                                acceptedAt));

                return new LegalAcceptanceStatus(
                                false,
                                terms.version(),
                                terms.hash(),
                                privacyNotice.version(),
                                privacyNotice.hash(),
                                acceptedAt);
        }
}
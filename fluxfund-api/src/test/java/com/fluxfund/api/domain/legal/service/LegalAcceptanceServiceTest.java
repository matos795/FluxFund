package com.fluxfund.api.domain.legal.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import com.fluxfund.api.domain.legal.UserLegalAcceptance;
import com.fluxfund.api.domain.legal.LegalAcceptanceStatus;
import com.fluxfund.api.domain.legal.dto.LegalDocumentSnapshot;
import com.fluxfund.api.domain.legal.repository.UserLegalAcceptanceRepository;
import com.fluxfund.api.domain.user.AppUserRepository;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

import java.util.Optional;

import org.mockito.ArgumentCaptor;

import com.fluxfund.api.domain.user.AppUser;

@ExtendWith(MockitoExtension.class)
class LegalAcceptanceServiceTest {

    @Mock
    private UserLegalAcceptanceRepository acceptanceRepository;

    @Mock
    private LegalDocumentService documentService;

    @InjectMocks
    private LegalAcceptanceService service;

    @Mock
    private AppUserRepository appUserRepository;

    @Test
    void shouldRequireAcceptanceWhenCurrentDocumentsWereNotAccepted() {

        UUID userId = UUID.randomUUID();

        LegalDocumentSnapshot terms = new LegalDocumentSnapshot(
                "2026-09",
                "terms-hash",
                "Termos");

        LegalDocumentSnapshot privacy = new LegalDocumentSnapshot(
                "2026-09",
                "privacy-hash",
                "Privacidade");

        when(documentService.currentTerms())
                .thenReturn(terms);

        when(documentService.currentPrivacyNotice())
                .thenReturn(privacy);

        when(
                acceptanceRepository
                        .existsByUser_IdAndTermsVersionAndTermsHashAndPrivacyNoticeVersionAndPrivacyNoticeHash(
                                userId,
                                "2026-09",
                                "terms-hash",
                                "2026-09",
                                "privacy-hash"))
                .thenReturn(false);

        LegalAcceptanceStatus status = service.getStatus(userId);

        assertThat(
                status.acceptanceRequired())
                .isTrue();
    }

    @Test
    void shouldRecognizeCurrentDocumentsAsAccepted() {

        UUID userId = UUID.randomUUID();

        LegalDocumentSnapshot terms = new LegalDocumentSnapshot(
                "2026-09",
                "terms-hash",
                "Termos");

        LegalDocumentSnapshot privacy = new LegalDocumentSnapshot(
                "2026-09",
                "privacy-hash",
                "Privacidade");

        when(documentService.currentTerms())
                .thenReturn(terms);

        when(documentService.currentPrivacyNotice())
                .thenReturn(privacy);

        when(
                acceptanceRepository
                        .existsByUser_IdAndTermsVersionAndTermsHashAndPrivacyNoticeVersionAndPrivacyNoticeHash(
                                userId,
                                "2026-09",
                                "terms-hash",
                                "2026-09",
                                "privacy-hash"))
                .thenReturn(true);

        LegalAcceptanceStatus status = service.getStatus(userId);

        assertThat(
                status.acceptanceRequired())
                .isFalse();

        assertThat(
                status.termsVersion())
                .isEqualTo(
                        "2026-09");

        assertThat(
                status.privacyNoticeVersion())
                .isEqualTo(
                        "2026-09");
    }

    @Test
    void shouldPersistAcceptanceForCurrentDocuments() {

        UUID userId = UUID.randomUUID();

        AppUser user = new AppUser();

        user.setId(userId);
        user.setActive(true);

        LegalDocumentSnapshot terms = new LegalDocumentSnapshot(
                "2026-09",
                "terms-hash",
                "Termos");

        LegalDocumentSnapshot privacy = new LegalDocumentSnapshot(
                "2026-09",
                "privacy-hash",
                "Privacidade");

        when(documentService.currentTerms())
                .thenReturn(terms);

        when(documentService.currentPrivacyNotice())
                .thenReturn(privacy);

        when(
                acceptanceRepository
                        .existsByUser_IdAndTermsVersionAndTermsHashAndPrivacyNoticeVersionAndPrivacyNoticeHash(
                                userId,
                                "2026-09",
                                "terms-hash",
                                "2026-09",
                                "privacy-hash"))
                .thenReturn(false);

        when(
                appUserRepository
                        .findByIdAndActiveTrue(
                                userId))
                .thenReturn(
                        Optional.of(user));

        LegalAcceptanceStatus status = service.acceptCurrentDocuments(userId);

        ArgumentCaptor<UserLegalAcceptance> acceptanceCaptor = ArgumentCaptor.forClass(
                UserLegalAcceptance.class);

        verify(acceptanceRepository)
                .save(
                        acceptanceCaptor.capture());

        UserLegalAcceptance saved = acceptanceCaptor.getValue();

        assertThat(saved.getUser()).isSameAs(user);

        assertThat(saved.getTermsVersion()).isEqualTo("2026-09");

        assertThat(saved.getTermsHash()).isEqualTo("terms-hash");

        assertThat(saved.getPrivacyNoticeVersion()).isEqualTo("2026-09");

        assertThat(saved.getPrivacyNoticeHash()).isEqualTo("privacy-hash");

        assertThat(saved.getAcceptedAt()).isNotNull();

        assertThat(status.acceptanceRequired()).isFalse();
    }

    @Test
    void shouldNotDuplicateAcceptanceWhenCurrentDocumentsWereAlreadyAccepted() {

        UUID userId = UUID.randomUUID();

        LegalDocumentSnapshot terms = new LegalDocumentSnapshot(
                "2026-09",
                "terms-hash",
                "Termos");

        LegalDocumentSnapshot privacy = new LegalDocumentSnapshot(
                "2026-09",
                "privacy-hash",
                "Privacidade");

        when(documentService.currentTerms())
                .thenReturn(terms);

        when(documentService.currentPrivacyNotice())
                .thenReturn(privacy);

        when(
                acceptanceRepository
                        .existsByUser_IdAndTermsVersionAndTermsHashAndPrivacyNoticeVersionAndPrivacyNoticeHash(
                                userId,
                                "2026-09",
                                "terms-hash",
                                "2026-09",
                                "privacy-hash"))
                .thenReturn(true);

        LegalAcceptanceStatus status = service.acceptCurrentDocuments(
                userId);

        verify(
                acceptanceRepository,
                never())
                .save(any());

        verify(appUserRepository, never())
                .findByIdAndActiveTrue(any());

        assertThat(status.acceptanceRequired()).isFalse();
    }
}
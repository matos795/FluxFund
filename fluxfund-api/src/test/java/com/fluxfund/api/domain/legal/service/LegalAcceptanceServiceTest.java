package com.fluxfund.api.domain.legal.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.fluxfund.api.domain.legal.LegalAcceptanceStatus;
import com.fluxfund.api.domain.legal.dto.LegalDocumentSnapshot;
import com.fluxfund.api.domain.legal.repository.UserLegalAcceptanceRepository;

@ExtendWith(MockitoExtension.class)
class LegalAcceptanceServiceTest {

    @Mock
    private UserLegalAcceptanceRepository acceptanceRepository;

    @Mock
    private LegalDocumentService documentService;

    @InjectMocks
    private LegalAcceptanceService service;

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
}
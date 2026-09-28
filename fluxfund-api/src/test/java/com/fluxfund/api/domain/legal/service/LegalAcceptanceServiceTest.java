package com.fluxfund.api.domain.legal.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;

import com.fluxfund.api.domain.legal.UserLegalAcceptance;
import com.fluxfund.api.domain.legal.LegalAcceptanceStatus;
import com.fluxfund.api.domain.legal.dto.LegalDocumentSnapshot;
import com.fluxfund.api.domain.legal.event.LegalAcceptanceRegisteredEvent;
import com.fluxfund.api.domain.legal.repository.UserLegalAcceptanceRepository;
import com.fluxfund.api.domain.user.AppUserRepository;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

import java.time.OffsetDateTime;
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

        @Mock
        private ApplicationEventPublisher eventPublisher;

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

                when(acceptanceRepository
                                .findFirstByUser_IdAndTermsVersionAndTermsHashAndPrivacyNoticeVersionAndPrivacyNoticeHashOrderByAcceptedAtDesc(
                                                userId,
                                                "2026-09",
                                                "terms-hash",
                                                "2026-09",
                                                "privacy-hash"))
                                .thenReturn(Optional.empty());

                LegalAcceptanceStatus status = service.getStatus(userId);

                assertThat(status.acceptanceRequired()).isTrue();
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

                OffsetDateTime acceptedAt = OffsetDateTime.parse("2026-09-24T11:30:00-03:00");

                UserLegalAcceptance acceptance = new UserLegalAcceptance();

                acceptance.setAcceptedAt(acceptedAt);

                when(documentService.currentTerms()).thenReturn(terms);

                when(documentService.currentPrivacyNotice()).thenReturn(privacy);

                when(acceptanceRepository
                                .findFirstByUser_IdAndTermsVersionAndTermsHashAndPrivacyNoticeVersionAndPrivacyNoticeHashOrderByAcceptedAtDesc(
                                                userId,
                                                "2026-09",
                                                "terms-hash",
                                                "2026-09",
                                                "privacy-hash"))
                                .thenReturn(Optional.of(acceptance));

                LegalAcceptanceStatus status = service.getStatus(userId);

                assertThat(status.acceptedAt()).isEqualTo(acceptedAt);

                assertThat(status.acceptanceRequired()).isFalse();

                assertThat(status.termsVersion()).isEqualTo("2026-09");

                assertThat(status.privacyNoticeVersion()).isEqualTo("2026-09");
        }

        @Test
        void shouldPersistAcceptanceForCurrentDocuments() {

                UUID userId = UUID.randomUUID();

                AppUser user = new AppUser();

                user.setId(userId);
                user.setActive(true);
                user.setName("Alexandre");
                user.setEmail("alexandre@example.com");

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
                                                .findFirstByUser_IdAndTermsVersionAndTermsHashAndPrivacyNoticeVersionAndPrivacyNoticeHashOrderByAcceptedAtDesc(
                                                                userId,
                                                                "2026-09",
                                                                "terms-hash",
                                                                "2026-09",
                                                                "privacy-hash"))
                                .thenReturn(Optional.empty());

                when(appUserRepository.findByIdAndActiveTrue(userId))
                                .thenReturn(Optional.of(user));

                LegalAcceptanceStatus status = service.acceptCurrentDocuments(userId);

                ArgumentCaptor<UserLegalAcceptance> acceptanceCaptor = ArgumentCaptor.forClass(
                                UserLegalAcceptance.class);

                verify(acceptanceRepository).save(acceptanceCaptor.capture());

                UserLegalAcceptance saved = acceptanceCaptor.getValue();

                ArgumentCaptor<LegalAcceptanceRegisteredEvent> eventCaptor = ArgumentCaptor.forClass(
                                LegalAcceptanceRegisteredEvent.class);

                verify(eventPublisher).publishEvent(eventCaptor.capture());

                LegalAcceptanceRegisteredEvent event = eventCaptor.getValue();

                assertThat(event.termsVersion()).isEqualTo("2026-09");

                assertThat(event.privacyNoticeVersion()).isEqualTo("2026-09");

                assertThat(event.acceptedAt()).isEqualTo(saved.getAcceptedAt());

                assertThat(event.recipientName()).isEqualTo("Alexandre");

                assertThat(event.recipientEmail()).isEqualTo("alexandre@example.com");

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

                OffsetDateTime acceptedAt = OffsetDateTime.parse(
                                "2026-09-24T11:30:00-03:00");

                UserLegalAcceptance existingAcceptance = new UserLegalAcceptance();

                existingAcceptance.setAcceptedAt(acceptedAt);

                when(documentService.currentTerms()).thenReturn(terms);

                when(documentService.currentPrivacyNotice()).thenReturn(privacy);

                when(acceptanceRepository
                                .findFirstByUser_IdAndTermsVersionAndTermsHashAndPrivacyNoticeVersionAndPrivacyNoticeHashOrderByAcceptedAtDesc(
                                                userId,
                                                "2026-09",
                                                "terms-hash",
                                                "2026-09",
                                                "privacy-hash"))
                                .thenReturn(Optional.of(existingAcceptance));

                LegalAcceptanceStatus status = service.acceptCurrentDocuments(userId);

                verify(acceptanceRepository, never()).save(any());

                verify(appUserRepository, never()).findByIdAndActiveTrue(any());

                verify(eventPublisher, never()).publishEvent(any());

                assertThat(status.acceptanceRequired()).isFalse();
                assertThat(status.acceptedAt()).isEqualTo(acceptedAt);
        }

        @Test
        void shouldReturnAcceptedAtForCurrentDocuments() {
                UUID userId = UUID.randomUUID();

                OffsetDateTime acceptedAt = OffsetDateTime.parse(
                                "2026-09-24T11:30:00-03:00");

                LegalDocumentSnapshot terms = new LegalDocumentSnapshot(
                                "2026-09",
                                "terms-hash",
                                "Termos");

                LegalDocumentSnapshot privacy = new LegalDocumentSnapshot(
                                "2026-09",
                                "privacy-hash",
                                "Privacidade");

                UserLegalAcceptance acceptance = new UserLegalAcceptance();

                acceptance.setAcceptedAt(acceptedAt);

                when(documentService.currentTerms()).thenReturn(terms);

                when(documentService.currentPrivacyNotice()).thenReturn(privacy);

                when(acceptanceRepository
                                .findFirstByUser_IdAndTermsVersionAndTermsHashAndPrivacyNoticeVersionAndPrivacyNoticeHashOrderByAcceptedAtDesc(
                                                userId,
                                                "2026-09",
                                                "terms-hash",
                                                "2026-09",
                                                "privacy-hash"))
                                .thenReturn(Optional.of(acceptance));

                LegalAcceptanceStatus status = service.getStatus(userId);

                assertThat(status.acceptanceRequired()).isFalse();

                assertThat(status.acceptedAt()).isEqualTo(acceptedAt);
        }
}
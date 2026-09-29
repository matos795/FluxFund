package com.fluxfund.api.domain.legal.event;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.OffsetDateTime;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.fluxfund.api.shared.mail.ApplicationMailService;

@ExtendWith(MockitoExtension.class)
class LegalAcceptanceMailListenerTest {

    @Mock
    private ApplicationMailService applicationMailService;

    private LegalAcceptanceMailListener listener;

    @BeforeEach
    void setUp() {

        listener = new LegalAcceptanceMailListener(
                applicationMailService,
                "http://localhost:5173/");
    }

    @Test
    void shouldSendLegalAcceptanceConfirmation() {

        OffsetDateTime acceptedAt = OffsetDateTime.parse(
                "2026-09-25T15:30:00-03:00");

        LegalAcceptanceRegisteredEvent event = new LegalAcceptanceRegisteredEvent(
                "Alexandre",
                "alexandre@example.com",
                "2026-09",
                "2026-09",
                acceptedAt);

        when(
                applicationMailService
                        .sendLegalAcceptanceConfirmation(
                                "Alexandre",
                                "alexandre@example.com",
                                "2026-09",
                                "2026-09",
                                acceptedAt,
                                "http://localhost:5173/settings/legal"))
                .thenReturn(true);

        listener.handle(event);

        verify(applicationMailService)
                .sendLegalAcceptanceConfirmation(
                        "Alexandre",
                        "alexandre@example.com",
                        "2026-09",
                        "2026-09",
                        acceptedAt,
                        "http://localhost:5173/settings/legal");
    }

    @Test
    void shouldNotFailWhenMailServiceThrowsException() {

        OffsetDateTime acceptedAt = OffsetDateTime.parse(
                "2026-09-25T15:30:00-03:00");

        LegalAcceptanceRegisteredEvent event = new LegalAcceptanceRegisteredEvent(
                "Alexandre",
                "alexandre@example.com",
                "2026-09",
                "2026-09",
                acceptedAt);

        when(
                applicationMailService
                        .sendLegalAcceptanceConfirmation(
                                "Alexandre",
                                "alexandre@example.com",
                                "2026-09",
                                "2026-09",
                                acceptedAt,
                                "http://localhost:5173/settings/legal"))
                .thenThrow(
                        new IllegalStateException(
                                "Brevo unavailable"));

        assertThatCode(
                () -> listener.handle(event))
                .doesNotThrowAnyException();
    }
}
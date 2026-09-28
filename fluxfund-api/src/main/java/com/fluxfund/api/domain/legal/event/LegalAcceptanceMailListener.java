package com.fluxfund.api.domain.legal.event;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import com.fluxfund.api.shared.mail.ApplicationMailService;

import lombok.extern.slf4j.Slf4j;

@Component
@Slf4j
public class LegalAcceptanceMailListener {

    private final ApplicationMailService applicationMailService;

    private final String frontendBaseUrl;

    public LegalAcceptanceMailListener(
            ApplicationMailService applicationMailService,

            @Value("${app.frontend.base-url:http://localhost:5173}") String frontendBaseUrl) {

        this.applicationMailService = applicationMailService;

        this.frontendBaseUrl = frontendBaseUrl;
    }

    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handle(
            LegalAcceptanceRegisteredEvent event) {

        String baseUrl = frontendBaseUrl.replaceAll(
                "/+$",
                "");

        String legalDocumentsUrl = baseUrl
                + "/settings/legal";

        try {
            boolean sent = applicationMailService
                    .sendLegalAcceptanceConfirmation(
                            event.recipientName(),
                            event.recipientEmail(),
                            event.termsVersion(),
                            event.privacyNoticeVersion(),
                            event.acceptedAt(),
                            legalDocumentsUrl);

            if (!sent) {
                log.warn(
                        "Legal acceptance confirmation email "
                                + "could not be sent. recipient={}",
                        event.recipientEmail());
            }

        } catch (RuntimeException exception) {

            log.error(
                    "Unexpected error sending legal "
                            + "acceptance confirmation. recipient={}",
                    event.recipientEmail(),
                    exception);
        }
    }
}
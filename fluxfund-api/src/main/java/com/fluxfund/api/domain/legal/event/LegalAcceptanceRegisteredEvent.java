package com.fluxfund.api.domain.legal.event;

import java.time.OffsetDateTime;

public record LegalAcceptanceRegisteredEvent(
        String recipientName,
        String recipientEmail,
        String termsVersion,
        String privacyNoticeVersion,
        OffsetDateTime acceptedAt) {
}
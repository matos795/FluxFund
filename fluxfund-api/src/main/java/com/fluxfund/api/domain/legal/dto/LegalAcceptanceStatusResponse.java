package com.fluxfund.api.domain.legal.dto;

import java.time.OffsetDateTime;

public record LegalAcceptanceStatusResponse(
        boolean enforcementEnabled,
        boolean acceptanceRequired,
        String termsVersion,
        String termsHash,
        String privacyNoticeVersion,
        String privacyNoticeHash,
        OffsetDateTime acceptedAt) {
}
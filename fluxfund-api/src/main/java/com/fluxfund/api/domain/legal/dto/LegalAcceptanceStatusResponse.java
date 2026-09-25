package com.fluxfund.api.domain.legal.dto;

import java.time.OffsetDateTime;

public record LegalAcceptanceStatusResponse(
                boolean acceptanceRequired,
                String termsVersion,
                String privacyNoticeVersion,
                OffsetDateTime acceptedAt) {
}
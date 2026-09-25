package com.fluxfund.api.domain.legal;

import java.time.OffsetDateTime;

public record LegalAcceptanceStatus(
                boolean acceptanceRequired,
                String termsVersion,
                String termsHash,
                String privacyNoticeVersion,
                String privacyNoticeHash,
                OffsetDateTime acceptedAt) {
}
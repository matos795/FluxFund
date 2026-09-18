package com.fluxfund.api.domain.legal;

public record LegalAcceptanceStatus(

        boolean acceptanceRequired,
        String termsVersion,
        String termsHash,
        String privacyNoticeVersion,
        String privacyNoticeHash) {
}
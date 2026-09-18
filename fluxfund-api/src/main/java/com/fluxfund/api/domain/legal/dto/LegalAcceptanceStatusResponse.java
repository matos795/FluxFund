package com.fluxfund.api.domain.legal.dto;

public record LegalAcceptanceStatusResponse(
        boolean acceptanceRequired,
        String termsVersion,
        String privacyNoticeVersion) {
}
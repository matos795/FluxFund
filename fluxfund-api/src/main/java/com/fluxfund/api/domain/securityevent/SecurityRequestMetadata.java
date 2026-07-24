package com.fluxfund.api.domain.securityevent;

public record SecurityRequestMetadata(

        String ipAddress,

        String userAgent

) {
}
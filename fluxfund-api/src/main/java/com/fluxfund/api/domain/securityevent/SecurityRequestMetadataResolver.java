package com.fluxfund.api.domain.securityevent;

import org.springframework.stereotype.Component;

import jakarta.servlet.http.HttpServletRequest;

@Component
public class SecurityRequestMetadataResolver {

    public SecurityRequestMetadata resolve(
            HttpServletRequest request) {

        return new SecurityRequestMetadata(
                truncate(
                        resolveIpAddress(request),
                        64),

                truncate(
                        normalize(
                                request.getHeader(
                                        "User-Agent")),
                        500));
    }

    private String resolveIpAddress(
            HttpServletRequest request) {

        String forwardedFor =
                normalize(
                        request.getHeader(
                                "X-Forwarded-For"));

        if (forwardedFor != null) {
            return forwardedFor
                    .split(",")[0]
                    .trim();
        }

        String realIp =
                normalize(
                        request.getHeader(
                                "X-Real-IP"));

        if (realIp != null) {
            return realIp;
        }

        return normalize(
                request.getRemoteAddr());
    }

    private String normalize(
            String value) {

        if (value == null
                || value.isBlank()) {

            return null;
        }

        return value.trim();
    }

    private String truncate(
            String value,
            int maximumLength) {

        if (value == null
                || value.length()
                <= maximumLength) {

            return value;
        }

        return value.substring(
                0,
                maximumLength);
    }
}
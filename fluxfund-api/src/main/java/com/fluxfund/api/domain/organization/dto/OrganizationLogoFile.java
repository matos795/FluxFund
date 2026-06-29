package com.fluxfund.api.domain.organization.dto;

public record OrganizationLogoFile(
        String filename,
        String contentType,
        byte[] content
) {
}
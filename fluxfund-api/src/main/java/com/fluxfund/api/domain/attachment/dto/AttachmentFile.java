package com.fluxfund.api.domain.attachment.dto;

public record AttachmentFile(
        String filename,
        String contentType,
        byte[] content
) {
}
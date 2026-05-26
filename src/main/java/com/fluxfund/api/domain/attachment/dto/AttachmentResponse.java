package com.fluxfund.api.domain.attachment.dto;

import java.time.OffsetDateTime;
import java.util.UUID;

import com.fluxfund.api.domain.attachment.AttachmentType;

public record AttachmentResponse(
        UUID id,
        AttachmentType type,
        String originalFilename,
        String contentType,
        Long sizeBytes,
        OffsetDateTime uploadedAt,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {
}
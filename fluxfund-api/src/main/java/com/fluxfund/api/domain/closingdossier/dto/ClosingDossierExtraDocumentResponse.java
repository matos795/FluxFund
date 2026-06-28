package com.fluxfund.api.domain.closingdossier.dto;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

import com.fluxfund.api.domain.closingdossier.ClosingDossierExtraDocumentType;

public record ClosingDossierExtraDocumentResponse(
        UUID id,
        LocalDate periodStartDate,
        LocalDate periodEndDate,
        ClosingDossierExtraDocumentType documentType,
        String title,
        String originalFilename,
        String contentType,
        Long sizeBytes,
        OffsetDateTime uploadedAt,
        Integer sortOrder,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {
}
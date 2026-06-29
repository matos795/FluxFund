package com.fluxfund.api.domain.closingdossier.mapper;

import com.fluxfund.api.domain.closingdossier.ClosingDossierExtraDocument;
import com.fluxfund.api.domain.closingdossier.dto.ClosingDossierExtraDocumentResponse;

public final class ClosingDossierExtraDocumentMapper {

    private ClosingDossierExtraDocumentMapper() {
    }

    public static ClosingDossierExtraDocumentResponse toResponse(
            ClosingDossierExtraDocument document) {

        return new ClosingDossierExtraDocumentResponse(
                document.getId(),
                document.getPeriodStartDate(),
                document.getPeriodEndDate(),
                document.getDocumentType(),
                document.getTitle(),
                document.getOriginalFilename(),
                document.getContentType(),
                document.getSizeBytes(),
                document.getUploadedAt(),
                document.getSortOrder(),
                document.getCreatedAt(),
                document.getUpdatedAt());
    }
}
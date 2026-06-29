package com.fluxfund.api.domain.closingdossier.export;

import java.util.UUID;

import com.fluxfund.api.domain.closingdossier.ClosingDossierExtraDocumentType;

public record ClosingDossierExportExtraDocument(
        UUID id,
        ClosingDossierExtraDocumentType documentType,
        String title,
        String originalFilename,
        String storageKey,
        Integer sortOrder
) {
}
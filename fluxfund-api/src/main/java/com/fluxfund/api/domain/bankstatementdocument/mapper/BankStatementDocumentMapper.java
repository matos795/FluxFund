package com.fluxfund.api.domain.bankstatementdocument.mapper;

import com.fluxfund.api.domain.bankstatementdocument.BankStatementDocument;
import com.fluxfund.api.domain.bankstatementdocument.dto.BankStatementDocumentResponse;

public final class BankStatementDocumentMapper {

    private BankStatementDocumentMapper() {

    }

    public static BankStatementDocumentResponse toResponse(BankStatementDocument document) {

        return new BankStatementDocumentResponse(
            document.getId(),
            document.getAccount().getId(),
            document.getAccount().getName(),
            document.getPeriodStartDate(),
            document.getPeriodEndDate(),
            document.getOriginalFilename(),
            document.getContentType(),
            document.getSizeBytes(),
            document.getUploadedAt(),
            document.getCreatedAt(),
            document.getUpdatedAt()
        );
    }

}

package com.fluxfund.api.domain.creditcardstatement.mapper;

import java.math.BigDecimal;

import com.fluxfund.api.domain.account.mapper.AccountMapper;
import com.fluxfund.api.domain.creditcardstatement.CreditCardStatement;
import com.fluxfund.api.domain.creditcardstatement.dto.CreditCardStatementDocumentResponse;
import com.fluxfund.api.domain.creditcardstatement.dto.CreditCardStatementResponse;

public class CreditCardStatementMapper {

        private CreditCardStatementMapper() {
        }

        public static CreditCardStatementResponse toResponse(
                        CreditCardStatement statement,
                        BigDecimal totalAmount,
                        long itemCount) {

                return new CreditCardStatementResponse(
                                statement.getId(),
                                statement.getCreditCardAccount() != null
                                                ? AccountMapper.toSummaryResponse(statement.getCreditCardAccount())
                                                : null,
                                statement.getPaymentAccount() != null
                                                ? AccountMapper.toSummaryResponse(statement.getPaymentAccount())
                                                : null,
                                statement.getPaymentTransaction() != null
                                                ? statement.getPaymentTransaction().getId()
                                                : null,
                                statement.getName(),
                                statement.getClosingDate(),
                                statement.getDueDate(),
                                statement.getPaymentDate(),
                                statement.getStatus(),
                                statement.getStatementPdfStorageKey() != null
                                                ? new CreditCardStatementDocumentResponse(
                                                                statement.getStatementPdfOriginalFilename(),
                                                                statement.getStatementPdfContentType(),
                                                                statement.getStatementPdfSizeBytes(),
                                                                statement.getStatementPdfUploadedAt())
                                                : null,
                                totalAmount != null ? totalAmount : BigDecimal.ZERO,
                                itemCount,
                                statement.getCreatedAt(),
                                statement.getUpdatedAt());
        }
}
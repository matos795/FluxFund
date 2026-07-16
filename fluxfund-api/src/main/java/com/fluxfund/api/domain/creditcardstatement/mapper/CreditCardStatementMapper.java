package com.fluxfund.api.domain.creditcardstatement.mapper;

import java.math.BigDecimal;
import java.time.LocalDate;

import com.fluxfund.api.domain.account.mapper.AccountMapper;
import com.fluxfund.api.domain.creditcardstatement.CreditCardStatement;
import com.fluxfund.api.domain.creditcardstatement.CreditCardStatementPaymentStatus;
import com.fluxfund.api.domain.creditcardstatement.dto.CreditCardStatementDocumentResponse;
import com.fluxfund.api.domain.creditcardstatement.dto.CreditCardStatementResponse;

public class CreditCardStatementMapper {

        private CreditCardStatementMapper() {
        }

        public static CreditCardStatementResponse toResponse(
                        CreditCardStatement statement,
                        CreditCardStatementPaymentStatus paymentStatus,
                        BigDecimal totalAmount,
                        BigDecimal paidAmount,
                        BigDecimal outstandingAmount,
                        long itemCount,
                        long paymentCount,
                        long unlinkedPaymentCount,
                        LocalDate lastPaymentDate) {

                return new CreditCardStatementResponse(

                                statement.getId(),

                                statement.getCreditCardAccount() != null
                                                ? AccountMapper.toSummaryResponse(
                                                                statement.getCreditCardAccount())
                                                : null,

                                statement.getPaymentAccount() != null
                                                ? AccountMapper.toSummaryResponse(
                                                                statement.getPaymentAccount())
                                                : null,

                                statement.getPaymentTransaction() != null
                                                ? statement.getPaymentTransaction().getId()
                                                : null,

                                statement.getName(),

                                statement.getClosingDate(),

                                statement.getDueDate(),

                                statement.getPaymentDate(),

                                statement.getStatus(),

                                paymentStatus,

                                statement.getStatementPdfStorageKey() != null
                                                ? new CreditCardStatementDocumentResponse(
                                                                statement.getStatementPdfOriginalFilename(),
                                                                statement.getStatementPdfContentType(),
                                                                statement.getStatementPdfSizeBytes(),
                                                                statement.getStatementPdfUploadedAt())
                                                : null,

                                statement.getPreviousBalanceAmount() != null
                                                ? statement.getPreviousBalanceAmount()
                                                : BigDecimal.ZERO,

                                totalAmount != null
                                                ? totalAmount
                                                : BigDecimal.ZERO,

                                paidAmount != null
                                                ? paidAmount
                                                : BigDecimal.ZERO,

                                outstandingAmount != null
                                                ? outstandingAmount
                                                : BigDecimal.ZERO,

                                itemCount,

                                paymentCount,

                                unlinkedPaymentCount,

                                lastPaymentDate,

                                statement.getCreatedAt(),

                                statement.getUpdatedAt());
        }
}
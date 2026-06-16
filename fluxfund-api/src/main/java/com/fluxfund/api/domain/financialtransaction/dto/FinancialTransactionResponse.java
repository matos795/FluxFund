package com.fluxfund.api.domain.financialtransaction.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

import com.fluxfund.api.domain.account.dto.AccountSummaryResponse;
import com.fluxfund.api.domain.category.dto.CategorySummaryResponse;
import com.fluxfund.api.domain.financialtransaction.FinancialTransactionSource;
import com.fluxfund.api.domain.financialtransaction.FinancialTransactionStatus;
import com.fluxfund.api.domain.financialtransaction.FinancialTransactionType;
import com.fluxfund.api.domain.financialtransaction.TransferDirection;
import com.fluxfund.api.domain.transactionallocation.dto.TransactionAllocationResponse;

public record FinancialTransactionResponse(
                UUID id,

                AccountSummaryResponse account,
                CategorySummaryResponse category,

                FinancialTransactionType type,
                FinancialTransactionSource source,
                FinancialTransactionStatus status,

                String externalId,

                UUID creditCardStatementId,
                Integer installmentNumber,
                Integer installmentCount,

                LocalDate dueDate,
                LocalDate settlementDate,

                BigDecimal expectedAmount,
                BigDecimal settledAmount,

                BigDecimal interestAmount,
                BigDecimal discountAmount,

                String description,
                String rawDescription,
                String documentNumber,

                List<TransactionAllocationResponse> allocations,

                LocalDateTime importedAt,
                LocalDateTime classifiedAt,

                OffsetDateTime createdAt,
                OffsetDateTime updatedAt,

                long attachmentCount,
                long paymentProofAttachmentCount,
                long fiscalAttachmentCount,

                TransferDirection transferDirection,
                UUID transferGroupId,
                AccountSummaryResponse transferCounterpartyAccount) {

}

package com.fluxfund.api.domain.financialtransaction.mapper;

import com.fluxfund.api.domain.account.Account;
import com.fluxfund.api.domain.account.mapper.AccountMapper;
import com.fluxfund.api.domain.category.Category;
import com.fluxfund.api.domain.category.mapper.CategoryMapper;
import com.fluxfund.api.domain.financialtransaction.FinancialTransaction;
import com.fluxfund.api.domain.financialtransaction.FinancialTransactionSource;
import com.fluxfund.api.domain.financialtransaction.FinancialTransactionType;
import com.fluxfund.api.domain.financialtransaction.dto.CreateFinancialTransactionRequest;
import com.fluxfund.api.domain.financialtransaction.dto.FinancialTransactionResponse;
import com.fluxfund.api.domain.financialtransaction.dto.UpdateFinancialTransactionRequest;
import com.fluxfund.api.domain.organization.Organization;
import com.fluxfund.api.domain.transactionallocation.mapper.TransactionAllocationMapper;

public class FinancialTransactionMapper {

    private FinancialTransactionMapper() {
    }

    public static FinancialTransaction createEntity(CreateFinancialTransactionRequest request,
            Organization organization, Account account, Category category) {
        return FinancialTransaction.builder()
                .organization(organization)
                .account(account)
                .type(request.type())
                .source(FinancialTransactionSource.MANUAL)
                .category(category)
                .dueDate(request.dueDate())
                .settlementDate(request.settlementDate())
                .expectedAmount(request.expectedAmount())
                .settledAmount(request.settledAmount())
                .description(request.description())
                .documentNumber(request.documentNumber())
                .build();
    }

    public static FinancialTransactionResponse toResponse(FinancialTransaction financialTransaction) {
        return new FinancialTransactionResponse(
                financialTransaction.getId(),
                AccountMapper.toSummaryResponse(financialTransaction.getAccount()),
                financialTransaction.getCategory() != null ? CategoryMapper.toSummary(financialTransaction.getCategory()) : null,
                financialTransaction.getType(),
                financialTransaction.getSource(),
                financialTransaction.getStatus(),
                financialTransaction.getExternalId(),
                financialTransaction.getDueDate(),
                financialTransaction.getSettlementDate(),
                financialTransaction.getExpectedAmount(),
                financialTransaction.getSettledAmount(),
                financialTransaction.getInterestAmount(),
                financialTransaction.getDiscountAmount(),
                financialTransaction.getDescription(),
                financialTransaction.getRawDescription(),
                financialTransaction.getDocumentNumber(),
                financialTransaction.getAllocations().stream()
                                    .map(TransactionAllocationMapper::toResponse).toList(),
                financialTransaction.getImportedAt(),
                financialTransaction.getClassifiedAt(),
                financialTransaction.getCreatedAt(),
                financialTransaction.getUpdatedAt());
    }

    public static void updateEntity(
            FinancialTransaction financialTransaction,
            UpdateFinancialTransactionRequest request,
            FinancialTransactionType type,
            Category category) {
        
        financialTransaction.setType(type);
        financialTransaction.setCategory(category);

        if (request.dueDate() != null) {
            financialTransaction.setDueDate(request.dueDate());
        }

        if (request.settlementDate() != null) {
            financialTransaction.setSettlementDate(
                    request.settlementDate());
        }

        if (request.expectedAmount() != null) {
            financialTransaction.setExpectedAmount(
                    request.expectedAmount());
        }

        if (request.settledAmount() != null) {
            financialTransaction.setSettledAmount(
                    request.settledAmount());
        }

        if (request.description() != null) {
            financialTransaction.setDescription(
                    request.description());
        }

        if (request.documentNumber() != null) {
            financialTransaction.setDocumentNumber(
                    request.documentNumber());
        }
    }
}

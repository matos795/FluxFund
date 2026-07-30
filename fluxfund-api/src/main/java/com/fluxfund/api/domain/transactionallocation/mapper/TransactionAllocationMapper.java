package com.fluxfund.api.domain.transactionallocation.mapper;

import com.fluxfund.api.domain.beneficiary.Beneficiary;
import com.fluxfund.api.domain.beneficiary.mapper.BeneficiaryMapper;
import com.fluxfund.api.domain.financialtransaction.FinancialTransaction;
import com.fluxfund.api.domain.fund.Fund;
import com.fluxfund.api.domain.fund.mapper.FundMapper;
import com.fluxfund.api.domain.transactionallocation.TransactionAllocation;
import com.fluxfund.api.domain.transactionallocation.dto.CreateTransactionAllocationRequest;
import com.fluxfund.api.domain.transactionallocation.dto.TransactionAllocationResponse;
import com.fluxfund.api.domain.transactionallocation.dto.UpdateTransactionAllocationRequest;
import com.fluxfund.api.shared.exception.BusinessException;
import com.fluxfund.api.shared.util.AmountNormalizer;

public final class TransactionAllocationMapper {

    private TransactionAllocationMapper() {
    }

    public static TransactionAllocation createEntity(
            CreateTransactionAllocationRequest request,
            FinancialTransaction financialTransaction,
            Fund fund,
            Beneficiary sourceParty,
            Beneficiary recipientParty) {

        TransactionAllocation allocation = new TransactionAllocation();

        allocation.setOrganization(financialTransaction.getOrganization());

        allocation.setFinancialTransaction(financialTransaction);

        allocation.setFund(fund);

        allocation.setSourceParty(sourceParty);

        allocation.setRecipientParty(recipientParty);

        allocation.setAmount(AmountNormalizer.normalizeAmount(financialTransaction, request.amount()));

        allocation.setReferenceMonth(request.referenceMonth());

        return allocation;
    }

    public static TransactionAllocationResponse toResponse(TransactionAllocation allocation) {

        Beneficiary recipientParty = allocation.getRecipientParty();

        return new TransactionAllocationResponse(
                allocation.getId(),

                allocation.getFinancialTransaction().getId(),

                FundMapper.toSummaryResponse(allocation.getFund()),

                recipientParty != null ? BeneficiaryMapper .toSummaryResponse(recipientParty) : null,

                BeneficiaryMapper.toFinancialPartySummaryResponse(allocation.getSourceParty()),

                BeneficiaryMapper.toFinancialPartySummaryResponse(recipientParty),

                allocation.getAmount(),
                allocation.getCreatedAt(),
                allocation.getUpdatedAt(),
                allocation.getReferenceMonth());
    }

    public static void updateEntity(
            TransactionAllocation allocation,
            UpdateTransactionAllocationRequest request,
            Fund fund,
            Beneficiary sourceParty,
            Beneficiary recipientParty) {

        if (fund != null) {
            allocation.setFund(fund);
        }

        allocation.setSourceParty(sourceParty);

        allocation.setRecipientParty(recipientParty);

        if (request.amount() != null) {
            allocation.setAmount(AmountNormalizer
                    .normalizeAmount(allocation.getFinancialTransaction(), request.amount()));
        }

        if (request.referenceMonth() != null && request.referenceMonth().getDayOfMonth() != 1) {
            throw new BusinessException("Reference month must use the first day of the month");
        }

        allocation.setReferenceMonth(request.referenceMonth());
    }
}
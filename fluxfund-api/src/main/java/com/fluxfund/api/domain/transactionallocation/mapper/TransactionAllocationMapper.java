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

public class TransactionAllocationMapper {

    public static TransactionAllocation createEntity(
            CreateTransactionAllocationRequest request,
            FinancialTransaction financialTransaction,
            Fund fund,
            Beneficiary beneficiary) {

        TransactionAllocation transactionAllocation = new TransactionAllocation(
                financialTransaction.getOrganization(),
                financialTransaction,
                fund,
                beneficiary,
                AmountNormalizer.normalizeAmount(financialTransaction, request.amount()),
                request.referenceMonth());

        return transactionAllocation;
    }

    public static TransactionAllocationResponse toResponse(TransactionAllocation transactionAllocation) {
        return new TransactionAllocationResponse(
                transactionAllocation.getId(),
                transactionAllocation.getFinancialTransaction().getId(),
                FundMapper.toSummaryResponse(transactionAllocation.getFund()),
                transactionAllocation.getBeneficiary() != null
                        ? BeneficiaryMapper.toSummaryResponse(transactionAllocation.getBeneficiary())
                        : null,
                transactionAllocation.getAmount(),
                transactionAllocation.getCreatedAt(),
                transactionAllocation.getUpdatedAt(),
                transactionAllocation.getReferenceMonth());
    }

    public static void updateEntity(TransactionAllocation transactionAllocation,
            UpdateTransactionAllocationRequest request, Fund fund, Beneficiary beneficiary) {
        if (fund != null) {
            transactionAllocation.setFund(fund);
        }
        transactionAllocation.setBeneficiary(beneficiary);

        if (request.amount() != null) {
            transactionAllocation.setAmount(AmountNormalizer
                    .normalizeAmount(transactionAllocation.getFinancialTransaction(), request.amount()));
        }

        if (request.referenceMonth() != null && request.referenceMonth().getDayOfMonth() != 1) {
            throw new BusinessException("Reference month must use the first day of the month");
        }
        transactionAllocation.setReferenceMonth(request.referenceMonth());
    }
}

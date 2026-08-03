package com.fluxfund.api.domain.financialcommitment.service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.fluxfund.api.domain.beneficiary.mapper.BeneficiaryMapper;
import com.fluxfund.api.domain.financialcommitment.dto.FinancialCommitmentAllocationSuggestionResponse;
import com.fluxfund.api.domain.financialcommitment.dto.FinancialCommitmentReconciliationItemResponse;
import com.fluxfund.api.domain.financialcommitment.FinancialCommitmentReconciliationStatus;
import com.fluxfund.api.domain.financialtransaction.FinancialTransaction;
import com.fluxfund.api.domain.financialtransaction.FinancialTransactionType;
import com.fluxfund.api.domain.financialtransaction.service.FinancialTransactionService;
import com.fluxfund.api.domain.fund.mapper.FundMapper;
import com.fluxfund.api.domain.transactionallocation.TransactionAllocation;
import com.fluxfund.api.domain.transactionallocation.dto.TransactionAllocationResponse;
import com.fluxfund.api.domain.transactionallocation.repository.TransactionAllocationRepository;
import com.fluxfund.api.security.OrganizationAccessService;
import com.fluxfund.api.shared.exception.BusinessException;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class FinancialCommitmentReconciliationService {

    private final TransactionAllocationRepository allocationRepository;

    private final FinancialCommitmentService commitmentService;

    private final FinancialTransactionService transactionService;

    private final OrganizationAccessService organizationAccessService;

    public Page<FinancialCommitmentReconciliationItemResponse> findAll(

            UUID organizationId,

            LocalDate startMonth,

            LocalDate endMonth,

            FinancialTransactionType transactionType,

            Pageable pageable) {

        organizationAccessService
                .requireReadAccess(
                        organizationId);

        LocalDate resolvedStartMonth = startMonth
                .withDayOfMonth(1);

        LocalDate resolvedEndMonth = endMonth
                .withDayOfMonth(1);

        if (resolvedEndMonth.isBefore(
                resolvedStartMonth)) {

            throw new BusinessException(
                    "End month cannot be before start month");
        }

        return allocationRepository
                .findUnlinkedFinancialCommitmentAllocations(

                        organizationId,

                        resolvedStartMonth,

                        resolvedEndMonth,

                        transactionType,

                        pageable)

                .map(
                        allocation -> toResponse(

                                organizationId,

                                allocation));
    }

    @Transactional
    public TransactionAllocationResponse link(

            UUID organizationId,

            UUID transactionId,

            UUID allocationId,

            UUID financialCommitmentId) {

        return transactionService
                .linkFinancialCommitment(

                        organizationId,

                        transactionId,

                        allocationId,

                        financialCommitmentId);
    }

    private FinancialCommitmentReconciliationItemResponse toResponse(

            UUID organizationId,

            TransactionAllocation allocation) {

        FinancialTransaction transaction = allocation
                .getFinancialTransaction();

        List<FinancialCommitmentAllocationSuggestionResponse> suggestions =

                commitmentService
                        .findAllocationSuggestions(

                                organizationId,

                                transaction.getType(),

                                allocation
                                        .getSourceParty() != null

                                                ? allocation
                                                        .getSourceParty()
                                                        .getId()

                                                : null,

                                allocation
                                        .getRecipientParty() != null

                                                ? allocation
                                                        .getRecipientParty()
                                                        .getId()

                                                : null,

                                allocation
                                        .getFund()
                                        .getId(),

                                allocation
                                        .getReferenceMonth(),

                                allocation
                                        .getAmount()
                                        .abs(),

                                null)

                        .stream()

                        .filter(
                                suggestion -> !suggestion
                                        .fulfilled()

                                        && suggestion
                                                .suggestedAmount()
                                                .compareTo(
                                                        BigDecimal.ZERO) > 0)

                        .toList();

        FinancialCommitmentReconciliationStatus matchStatus = resolveStatus(

                allocation,

                suggestions);

        String description = transaction.getDescription() != null

                && !transaction
                        .getDescription()
                        .isBlank()

                                ? transaction
                                        .getDescription()

                                : transaction
                                        .getRawDescription();

        return new FinancialCommitmentReconciliationItemResponse(

                allocation.getId(),

                transaction.getId(),

                transaction
                        .getSettlementDate(),

                description,

                transaction.getType(),

                transaction
                        .getAccount()
                        .getName(),

                FundMapper
                        .toSummaryResponse(
                                allocation
                                        .getFund()),

                BeneficiaryMapper
                        .toFinancialPartySummaryResponse(

                                allocation
                                        .getSourceParty()),

                BeneficiaryMapper
                        .toFinancialPartySummaryResponse(

                                allocation
                                        .getRecipientParty()),

                allocation
                        .getReferenceMonth(),

                allocation
                        .getAmount()
                        .abs(),

                matchStatus,

                suggestions);
    }

    private FinancialCommitmentReconciliationStatus resolveStatus(

            TransactionAllocation allocation,

            List<FinancialCommitmentAllocationSuggestionResponse> suggestions) {

        if (suggestions.isEmpty()) {

            return FinancialCommitmentReconciliationStatus.NO_MATCH;
        }

        if (suggestions.size() != 1) {

            return FinancialCommitmentReconciliationStatus.REVIEW;
        }

        FinancialCommitmentAllocationSuggestionResponse suggestion = suggestions.get(0);

        boolean exact =

                suggestion.exactFundMatch()

                        && suggestion
                                .suggestedAmount()
                                .compareTo(
                                        allocation
                                                .getAmount()
                                                .abs()) == 0;

        return exact

                ? FinancialCommitmentReconciliationStatus.EXACT

                : FinancialCommitmentReconciliationStatus.REVIEW;
    }
}
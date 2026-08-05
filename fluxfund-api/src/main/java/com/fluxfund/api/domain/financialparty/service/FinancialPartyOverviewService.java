package com.fluxfund.api.domain.financialparty.service;

import java.math.BigDecimal;
import java.util.EnumSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import com.fluxfund.api.domain.beneficiary.Beneficiary;
import com.fluxfund.api.domain.beneficiary.mapper.BeneficiaryMapper;
import com.fluxfund.api.domain.beneficiary.repository.BeneficiaryRepository;
import com.fluxfund.api.domain.financialcommitment.FinancialCommitment;
import com.fluxfund.api.domain.financialcommitment.mapper.FinancialCommitmentMapper;
import com.fluxfund.api.domain.financialcommitment.repository.FinancialCommitmentRepository;
import com.fluxfund.api.domain.financialparty.dto.FinancialPartyActivityResponse;
import com.fluxfund.api.domain.financialparty.dto.FinancialPartyActivityRole;
import com.fluxfund.api.domain.financialparty.dto.FinancialPartyOverviewResponse;
import com.fluxfund.api.domain.financialparty.dto.FinancialPartyOverviewSummaryResponse;
import com.fluxfund.api.domain.financialtransaction.FinancialTransaction;
import com.fluxfund.api.domain.financialtransaction.FinancialTransactionType;
import com.fluxfund.api.domain.receipt.mapper.ReceiptMapper;
import com.fluxfund.api.domain.receipt.repository.ReceiptRepository;
import com.fluxfund.api.domain.supportagreement.SupportAgreement;
import com.fluxfund.api.domain.supportagreement.mapper.SupportAgreementMapper;
import com.fluxfund.api.domain.supportagreement.repository.SupportAgreementRepository;
import com.fluxfund.api.domain.transactionallocation.TransactionAllocation;
import com.fluxfund.api.domain.transactionallocation.repository.TransactionAllocationRepository;
import com.fluxfund.api.security.OrganizationAccessService;
import com.fluxfund.api.shared.exception.ResourceNotFoundException;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class FinancialPartyOverviewService {

    private static final int RECENT_ACTIVITY_LIMIT = 20;

    private static final int RECENT_RECEIPT_LIMIT = 10;

    private final BeneficiaryRepository beneficiaryRepository;

    private final TransactionAllocationRepository allocationRepository;

    private final FinancialCommitmentRepository commitmentRepository;

    private final SupportAgreementRepository supportAgreementRepository;

    private final ReceiptRepository receiptRepository;

    private final OrganizationAccessService organizationAccessService;

    public FinancialPartyOverviewResponse getOverview(

            UUID organizationId,

            UUID partyId) {

        organizationAccessService
                .requireReadAccess(
                        organizationId);

        Beneficiary party = beneficiaryRepository
                .findByIdAndOrganizationId(

                        partyId,

                        organizationId)

                .orElseThrow(
                        () -> new ResourceNotFoundException(
                                "Financial party not found"));

        List<FinancialCommitment> commitments = commitmentRepository
                .findAllByFinancialParty(

                        organizationId,

                        partyId);

        List<SupportAgreement> supportAgreements = supportAgreementRepository
                .findAllByFinancialParty(

                        organizationId,

                        partyId);

        List<TransactionAllocation> activities = allocationRepository
                .findRecentSettledByFinancialParty(

                        organizationId,

                        partyId,

                        PageRequest.of(
                                0,
                                RECENT_ACTIVITY_LIMIT));

        var receipts = receiptRepository
                .findRecentByFinancialParty(

                        organizationId,

                        partyId,

                        PageRequest.of(
                                0,
                                RECENT_RECEIPT_LIMIT));

        long activeCommitmentCount = commitments
                .stream()

                .filter(
                        commitment -> Boolean.TRUE.equals(
                                commitment.getActive()))

                .count();

        long activeSupportAgreementCount = supportAgreements
                .stream()

                .filter(
                        agreement -> Boolean.TRUE.equals(
                                agreement.getActive()))

                .count();

        FinancialPartyOverviewSummaryResponse summary = new FinancialPartyOverviewSummaryResponse(

                allocationRepository
                        .sumSettledIncomeFromParty(

                                organizationId,

                                partyId),

                allocationRepository
                        .sumSettledIncomeDestinedToParty(

                                organizationId,

                                partyId),

                allocationRepository
                        .sumSettledExpensePaidToParty(

                                organizationId,

                                partyId),

                allocationRepository
                        .countSettledTransactionsByParty(

                                organizationId,

                                partyId),

                activeCommitmentCount,

                activeSupportAgreementCount,

                receiptRepository
                        .countIssuedByFinancialParty(

                                organizationId,

                                partyId),

                receiptRepository
                        .sumIssuedByFinancialParty(

                                organizationId,

                                partyId));

        return new FinancialPartyOverviewResponse(

                BeneficiaryMapper
                        .toResponse(
                                party),

                summary,

                activities
                        .stream()

                        .map(
                                activity -> toActivityResponse(

                                        partyId,

                                        activity))

                        .toList(),

                commitments
                        .stream()
                        .map(FinancialCommitmentMapper::toResponse)
                        .toList(),

                supportAgreements.stream()
                        .map(SupportAgreementMapper::toResponse)
                        .toList(),

                receipts
                        .stream()

                        .map(
                                ReceiptMapper::toResponse)

                        .toList());
    }

    private FinancialPartyActivityResponse toActivityResponse(

            UUID partyId,

            TransactionAllocation allocation) {

        FinancialTransaction transaction = allocation
                .getFinancialTransaction();

        Set<FinancialPartyActivityRole> roles = EnumSet.noneOf(
                FinancialPartyActivityRole.class);

        if (allocation.getSourceParty() != null

                && allocation
                        .getSourceParty()
                        .getId()
                        .equals(
                                partyId)) {

            roles.add(
                    FinancialPartyActivityRole.INCOME_SOURCE);
        }

        if (allocation.getRecipientParty() != null

                && allocation
                        .getRecipientParty()
                        .getId()
                        .equals(
                                partyId)) {

            roles.add(

                    transaction.getType() == FinancialTransactionType.INCOME

                            ? FinancialPartyActivityRole.DESIGNATED_RECIPIENT

                            : FinancialPartyActivityRole.PAYMENT_RECIPIENT);
        }

        String description = firstText(

                transaction.getDescription(),

                transaction.getRawDescription(),

                "Movimentação financeira");

        return new FinancialPartyActivityResponse(

                allocation.getId(),

                transaction.getId(),

                transaction.getType(),

                transaction.getSettlementDate(),

                description,

                transaction
                        .getAccount()
                        .getName(),

                allocation
                        .getFund()
                        .getName(),

                allocation
                        .getAmount()
                        .abs(),

                allocation.getReferenceMonth(),

                roles,

                FinancialCommitmentMapper
                        .toAllocationSummary(

                                allocation
                                        .getFinancialCommitment()));
    }

    private String firstText(
            String... values) {

        for (String value : values) {

            if (StringUtils.hasText(
                    value)) {

                return value.trim();
            }
        }

        return null;
    }
}
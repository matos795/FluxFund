package com.fluxfund.api.domain.report.service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.fluxfund.api.domain.financialtransaction.FinancialTransactionType;
import com.fluxfund.api.domain.financialtransaction.repository.FinancialTransactionRepository;
import com.fluxfund.api.domain.organization.OrganizationRepository;
import com.fluxfund.api.domain.report.dto.accountability.AccountabilityAccountBreakdownResponse;
import com.fluxfund.api.domain.report.dto.accountability.AccountabilityByAccountItemResponse;
import com.fluxfund.api.domain.report.dto.accountability.AccountabilityByAccountProjection;
import com.fluxfund.api.domain.report.dto.accountability.AccountabilityByAccountReportResponse;
import com.fluxfund.api.domain.report.dto.accountability.AccountabilityReportItemResponse;
import com.fluxfund.api.domain.report.dto.accountability.AccountabilityReportResponse;
import com.fluxfund.api.domain.report.dto.category.CategoryResultReportResponse;
import com.fluxfund.api.domain.report.dto.fund.FundReportItemResponse;
import com.fluxfund.api.domain.report.dto.fund.FundReportResponse;
import com.fluxfund.api.domain.supportagreement.SupportAgreement;
import com.fluxfund.api.domain.supportagreement.repository.SupportAgreementRepository;
import com.fluxfund.api.domain.transactionallocation.repository.TransactionAllocationRepository;
import com.fluxfund.api.shared.exception.BusinessException;
import com.fluxfund.api.shared.exception.ResourceNotFoundException;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ReportService {

        private final OrganizationRepository organizationRepository;
        private final FinancialTransactionRepository financialTransactionRepository;
        private final TransactionAllocationRepository transactionAllocationRepository;
        private final SupportAgreementRepository supportAgreementRepository;

        public CategoryResultReportResponse getCategoryResultReport(
                        UUID organizationId,
                        LocalDate startDate,
                        LocalDate endDate) {

                validateOrganizationExists(organizationId);

                LocalDate resolvedStartDate = startDate != null
                                ? startDate
                                : LocalDate.now().withDayOfMonth(1);

                LocalDate resolvedEndDate = endDate != null
                                ? endDate
                                : LocalDate.now();

                if (resolvedEndDate.isBefore(resolvedStartDate)) {
                        throw new BusinessException("End date cannot be before start date");
                }

                var items = financialTransactionRepository.findCategoryResultReport(
                                organizationId,
                                resolvedStartDate,
                                resolvedEndDate);

                BigDecimal incomeTotal = items.stream()
                                .filter(item -> item.type() == FinancialTransactionType.INCOME)
                                .map(item -> item.total())
                                .reduce(BigDecimal.ZERO, BigDecimal::add);

                BigDecimal expenseTotal = items.stream()
                                .filter(item -> item.type() == FinancialTransactionType.EXPENSE)
                                .map(item -> item.total())
                                .reduce(BigDecimal.ZERO, BigDecimal::add);

                BigDecimal netTotal = incomeTotal.subtract(expenseTotal);

                return new CategoryResultReportResponse(
                                resolvedStartDate,
                                resolvedEndDate,
                                incomeTotal,
                                expenseTotal,
                                netTotal,
                                items);
        }

        public FundReportResponse getFundReport(
                        UUID organizationId,
                        LocalDate startDate,
                        LocalDate endDate) {

                validateOrganizationExists(organizationId);

                LocalDate resolvedStartDate = startDate != null
                                ? startDate
                                : LocalDate.now().withDayOfMonth(1);

                LocalDate resolvedEndDate = endDate != null
                                ? endDate
                                : LocalDate.now();

                if (resolvedEndDate.isBefore(resolvedStartDate)) {
                        throw new BusinessException("End date cannot be before start date");
                }

                var projections = transactionAllocationRepository.findFundReport(
                                organizationId,
                                resolvedStartDate,
                                resolvedEndDate);

                var items = projections.stream()
                                .map(projection -> {
                                        BigDecimal periodBalance = projection.incomeAllocated()
                                                        .subtract(projection.expenseAllocated());

                                        BigDecimal currentBalance = projection.initialBalance()
                                                        .add(projection.historicalAllocationBalance());

                                        return new FundReportItemResponse(
                                                        projection.fundId(),
                                                        projection.fundName(),
                                                        projection.initialBalance(),
                                                        projection.incomeAllocated(),
                                                        projection.expenseAllocated(),
                                                        periodBalance,
                                                        currentBalance,
                                                        projection.allocationCount());
                                })
                                .toList();

                BigDecimal fundsTotalBalance = items.stream()
                                .map(FundReportItemResponse::currentBalance)
                                .reduce(BigDecimal.ZERO, BigDecimal::add);

                BigDecimal incomeAllocatedTotal = items.stream()
                                .map(FundReportItemResponse::incomeAllocated)
                                .reduce(BigDecimal.ZERO, BigDecimal::add);

                BigDecimal expenseAllocatedTotal = items.stream()
                                .map(FundReportItemResponse::expenseAllocated)
                                .reduce(BigDecimal.ZERO, BigDecimal::add);

                long negativeFundsCount = items.stream()
                                .filter(item -> item.currentBalance().compareTo(BigDecimal.ZERO) < 0)
                                .count();

                return new FundReportResponse(
                                resolvedStartDate,
                                resolvedEndDate,
                                fundsTotalBalance,
                                incomeAllocatedTotal,
                                expenseAllocatedTotal,
                                negativeFundsCount,
                                items);
        }

        public AccountabilityReportResponse getAccountabilityReport(
                        UUID organizationId,
                        LocalDate startDate,
                        LocalDate endDate) {

                validateOrganizationExists(organizationId);

                LocalDate resolvedStartDate = startDate != null
                                ? startDate
                                : LocalDate.now().withDayOfMonth(1);

                LocalDate resolvedEndDate = endDate != null
                                ? endDate
                                : LocalDate.now();

                if (resolvedEndDate.isBefore(resolvedStartDate)) {
                        throw new BusinessException("End date cannot be before start date");
                }

                List<SupportAgreement> supportAgreements = findSupportAgreementsForReport(
                                organizationId,
                                resolvedStartDate,
                                resolvedEndDate);

                Map<String, BigDecimal> commitmentByBeneficiaryAndFund = buildCommitmentAmountMap(
                                organizationId,
                                resolvedStartDate,
                                resolvedEndDate);

                var projections = transactionAllocationRepository.findAccountabilityReport(
                                organizationId,
                                resolvedStartDate,
                                resolvedEndDate);

                List<AccountabilityReportItemResponse> items = new ArrayList<>(
                                projections.stream()
                                                .map(projection -> {
                                                        String key = buildBeneficiaryFundKey(
                                                                        projection.beneficiaryId(),
                                                                        projection.fundId());

                                                        BigDecimal allocatedAmount = projection.allocatedAmount();
                                                        BigDecimal transferredAmount = projection.transferredAmount();

                                                        BigDecimal commitmentAmount = commitmentByBeneficiaryAndFund
                                                                        .getOrDefault(key, BigDecimal.ZERO);

                                                        BigDecimal payableAmount = commitmentAmount
                                                                        .add(allocatedAmount);

                                                        BigDecimal pendingAmount = payableAmount
                                                                        .subtract(transferredAmount);

                                                        return new AccountabilityReportItemResponse(
                                                                        projection.beneficiaryId(),
                                                                        projection.beneficiaryName(),
                                                                        projection.fundId(),
                                                                        projection.fundName(),
                                                                        allocatedAmount,
                                                                        transferredAmount,
                                                                        commitmentAmount,
                                                                        payableAmount,
                                                                        pendingAmount,
                                                                        projection.allocationCount());
                                                })
                                                .toList());

                Set<String> existingKeys = items.stream()
                                .map(item -> buildBeneficiaryFundKey(
                                                item.beneficiaryId(),
                                                item.fundId()))
                                .collect(Collectors.toSet());

                for (SupportAgreement agreement : supportAgreements) {
                        String key = buildBeneficiaryFundKey(
                                        agreement.getBeneficiary().getId(),
                                        agreement.getFund().getId());

                        if (existingKeys.contains(key)) {
                                continue;
                        }

                        BigDecimal commitmentAmount = calculateCommitmentAmountForPeriod(
                                        agreement,
                                        resolvedStartDate,
                                        resolvedEndDate);

                        if (commitmentAmount.compareTo(BigDecimal.ZERO) <= 0) {
                                continue;
                        }

                        BigDecimal allocatedAmount = BigDecimal.ZERO;
                        BigDecimal transferredAmount = BigDecimal.ZERO;
                        BigDecimal payableAmount = commitmentAmount;
                        BigDecimal pendingAmount = payableAmount;

                        items.add(new AccountabilityReportItemResponse(
                                        agreement.getBeneficiary().getId(),
                                        agreement.getBeneficiary().getName(),
                                        agreement.getFund().getId(),
                                        agreement.getFund().getName(),
                                        allocatedAmount,
                                        transferredAmount,
                                        commitmentAmount,
                                        payableAmount,
                                        pendingAmount,
                                        0));
                }

                BigDecimal allocatedTotal = items.stream()
                                .map(AccountabilityReportItemResponse::allocatedAmount)
                                .reduce(BigDecimal.ZERO, BigDecimal::add);

                BigDecimal transferredTotal = items.stream()
                                .map(AccountabilityReportItemResponse::transferredAmount)
                                .reduce(BigDecimal.ZERO, BigDecimal::add);

                BigDecimal commitmentTotal = items.stream()
                                .map(AccountabilityReportItemResponse::commitmentAmount)
                                .reduce(BigDecimal.ZERO, BigDecimal::add);

                BigDecimal payableTotal = items.stream()
                                .map(AccountabilityReportItemResponse::payableAmount)
                                .reduce(BigDecimal.ZERO, BigDecimal::add);

                BigDecimal pendingTotal = items.stream()
                                .map(AccountabilityReportItemResponse::pendingAmount)
                                .reduce(BigDecimal.ZERO, BigDecimal::add);

                long beneficiariesWithPendingBalance = items.stream()
                                .filter(item -> item.pendingAmount().compareTo(BigDecimal.ZERO) > 0)
                                .map(AccountabilityReportItemResponse::beneficiaryId)
                                .distinct()
                                .count();

                return new AccountabilityReportResponse(
                                resolvedStartDate,
                                resolvedEndDate,
                                allocatedTotal,
                                transferredTotal,
                                commitmentTotal,
                                payableTotal,
                                pendingTotal,
                                beneficiariesWithPendingBalance,
                                items);
        }

        public AccountabilityByAccountReportResponse getAccountabilityReportByAccount(
                        UUID organizationId,
                        LocalDate startDate,
                        LocalDate endDate) {

                validateOrganizationExists(organizationId);

                LocalDate resolvedStartDate = startDate != null
                                ? startDate
                                : LocalDate.now().withDayOfMonth(1);

                LocalDate resolvedEndDate = endDate != null
                                ? endDate
                                : LocalDate.now();

                if (resolvedEndDate.isBefore(resolvedStartDate)) {
                        throw new BusinessException("End date cannot be before start date");
                }

                List<SupportAgreement> supportAgreements = findSupportAgreementsForReport(
                                organizationId,
                                resolvedStartDate,
                                resolvedEndDate);

                Map<String, BigDecimal> commitmentByBeneficiaryAndFund = buildCommitmentAmountMap(
                                organizationId,
                                resolvedStartDate,
                                resolvedEndDate);

                var projections = transactionAllocationRepository.findAccountabilityReportByAccount(
                                organizationId,
                                resolvedStartDate,
                                resolvedEndDate);

                Map<String, List<AccountabilityByAccountProjection>> grouped = new LinkedHashMap<>();

                for (AccountabilityByAccountProjection projection : projections) {
                        String key = buildBeneficiaryFundKey(
                                        projection.beneficiaryId(),
                                        projection.fundId());

                        grouped.computeIfAbsent(key, ignored -> new ArrayList<>())
                                        .add(projection);
                }

                List<AccountabilityByAccountItemResponse> items = new ArrayList<>(
                                grouped.values()
                                                .stream()
                                                .map(group -> {
                                                        AccountabilityByAccountProjection first = group.get(0);

                                                        List<AccountabilityAccountBreakdownResponse> accounts = group
                                                                        .stream()
                                                                        .map(accountProjection -> {
                                                                                BigDecimal accountPendingAmount = accountProjection
                                                                                                .allocatedAmount()
                                                                                                .subtract(accountProjection
                                                                                                                .transferredAmount());

                                                                                return new AccountabilityAccountBreakdownResponse(
                                                                                                accountProjection
                                                                                                                .accountId(),
                                                                                                accountProjection
                                                                                                                .accountName(),
                                                                                                accountProjection
                                                                                                                .bankName(),
                                                                                                accountProjection
                                                                                                                .allocatedAmount(),
                                                                                                accountProjection
                                                                                                                .transferredAmount(),
                                                                                                accountPendingAmount,
                                                                                                accountProjection
                                                                                                                .allocationCount());
                                                                        })
                                                                        .toList();

                                                        BigDecimal allocatedAmount = accounts.stream()
                                                                        .map(AccountabilityAccountBreakdownResponse::allocatedAmount)
                                                                        .reduce(BigDecimal.ZERO, BigDecimal::add);

                                                        BigDecimal transferredAmount = accounts.stream()
                                                                        .map(AccountabilityAccountBreakdownResponse::transferredAmount)
                                                                        .reduce(BigDecimal.ZERO, BigDecimal::add);

                                                        String key = buildBeneficiaryFundKey(
                                                                        first.beneficiaryId(),
                                                                        first.fundId());

                                                        BigDecimal commitmentAmount = commitmentByBeneficiaryAndFund
                                                                        .getOrDefault(key, BigDecimal.ZERO);

                                                        BigDecimal payableAmount = commitmentAmount
                                                                        .add(allocatedAmount);

                                                        BigDecimal pendingAmount = payableAmount
                                                                        .subtract(transferredAmount);

                                                        long allocationCount = accounts.stream()
                                                                        .mapToLong(AccountabilityAccountBreakdownResponse::allocationCount)
                                                                        .sum();

                                                        return new AccountabilityByAccountItemResponse(
                                                                        first.beneficiaryId(),
                                                                        first.beneficiaryName(),
                                                                        first.fundId(),
                                                                        first.fundName(),
                                                                        allocatedAmount,
                                                                        transferredAmount,
                                                                        commitmentAmount,
                                                                        payableAmount,
                                                                        pendingAmount,
                                                                        allocationCount,
                                                                        accounts);
                                                })
                                                .toList());

                Set<String> existingKeys = items.stream()
                                .map(item -> buildBeneficiaryFundKey(
                                                item.beneficiaryId(),
                                                item.fundId()))
                                .collect(Collectors.toSet());

                for (SupportAgreement agreement : supportAgreements) {
                        String key = buildBeneficiaryFundKey(
                                        agreement.getBeneficiary().getId(),
                                        agreement.getFund().getId());

                        if (existingKeys.contains(key)) {
                                continue;
                        }

                        BigDecimal commitmentAmount = calculateCommitmentAmountForPeriod(
                                        agreement,
                                        resolvedStartDate,
                                        resolvedEndDate);

                        if (commitmentAmount.compareTo(BigDecimal.ZERO) <= 0) {
                                continue;
                        }

                        BigDecimal allocatedAmount = BigDecimal.ZERO;
                        BigDecimal transferredAmount = BigDecimal.ZERO;
                        BigDecimal payableAmount = commitmentAmount;
                        BigDecimal pendingAmount = payableAmount;

                        items.add(new AccountabilityByAccountItemResponse(
                                        agreement.getBeneficiary().getId(),
                                        agreement.getBeneficiary().getName(),
                                        agreement.getFund().getId(),
                                        agreement.getFund().getName(),
                                        allocatedAmount,
                                        transferredAmount,
                                        commitmentAmount,
                                        payableAmount,
                                        pendingAmount,
                                        0,
                                        List.of()));
                }

                BigDecimal allocatedTotal = items.stream()
                                .map(AccountabilityByAccountItemResponse::allocatedAmount)
                                .reduce(BigDecimal.ZERO, BigDecimal::add);

                BigDecimal transferredTotal = items.stream()
                                .map(AccountabilityByAccountItemResponse::transferredAmount)
                                .reduce(BigDecimal.ZERO, BigDecimal::add);

                BigDecimal commitmentTotal = items.stream()
                                .map(AccountabilityByAccountItemResponse::commitmentAmount)
                                .reduce(BigDecimal.ZERO, BigDecimal::add);

                BigDecimal payableTotal = items.stream()
                                .map(AccountabilityByAccountItemResponse::payableAmount)
                                .reduce(BigDecimal.ZERO, BigDecimal::add);

                BigDecimal pendingTotal = items.stream()
                                .map(AccountabilityByAccountItemResponse::pendingAmount)
                                .reduce(BigDecimal.ZERO, BigDecimal::add);

                long beneficiariesWithPendingBalance = items.stream()
                                .filter(item -> item.pendingAmount().compareTo(BigDecimal.ZERO) > 0)
                                .map(AccountabilityByAccountItemResponse::beneficiaryId)
                                .distinct()
                                .count();

                return new AccountabilityByAccountReportResponse(
                                resolvedStartDate,
                                resolvedEndDate,
                                allocatedTotal,
                                transferredTotal,
                                commitmentTotal,
                                payableTotal,
                                pendingTotal,
                                beneficiariesWithPendingBalance,
                                items);
        }

        private void validateOrganizationExists(UUID organizationId) {
                if (!organizationRepository.existsById(organizationId)) {
                        throw new ResourceNotFoundException("Organization not found");
                }
        }

        private BigDecimal calculateCommitmentAmountForPeriod(
                        SupportAgreement agreement,
                        LocalDate startDate,
                        LocalDate endDate) {
                LocalDate effectiveStartDate = agreement.getStartDate().isAfter(startDate)
                                ? agreement.getStartDate()
                                : startDate;

                LocalDate effectiveEndDate = agreement.getEndDate() != null
                                && agreement.getEndDate().isBefore(endDate)
                                                ? agreement.getEndDate()
                                                : endDate;

                if (effectiveEndDate.isBefore(effectiveStartDate)) {
                        return BigDecimal.ZERO;
                }

                long months = ChronoUnit.MONTHS.between(
                                effectiveStartDate.withDayOfMonth(1),
                                effectiveEndDate.withDayOfMonth(1)) + 1;

                return agreement.getAmount().multiply(BigDecimal.valueOf(months));
        }

        private Map<String, BigDecimal> buildCommitmentAmountMap(
                        UUID organizationId,
                        LocalDate startDate,
                        LocalDate endDate) {
                List<SupportAgreement> agreements = supportAgreementRepository.findActiveInPeriodForReport(
                                organizationId,
                                startDate,
                                endDate);

                Map<String, BigDecimal> commitmentByBeneficiaryAndFund = new HashMap<>();

                for (SupportAgreement agreement : agreements) {
                        String key = buildBeneficiaryFundKey(
                                        agreement.getBeneficiary().getId(),
                                        agreement.getFund().getId());

                        BigDecimal commitmentAmount = calculateCommitmentAmountForPeriod(
                                        agreement,
                                        startDate,
                                        endDate);

                        commitmentByBeneficiaryAndFund.merge(
                                        key,
                                        commitmentAmount,
                                        BigDecimal::add);
                }

                return commitmentByBeneficiaryAndFund;
        }

        private String buildBeneficiaryFundKey(UUID beneficiaryId, UUID fundId) {
                return beneficiaryId + ":" + fundId;
        }

        private List<SupportAgreement> findSupportAgreementsForReport(
                        UUID organizationId,
                        LocalDate startDate,
                        LocalDate endDate) {
                return supportAgreementRepository.findActiveInPeriodForReport(
                                organizationId,
                                startDate,
                                endDate);
        }
}
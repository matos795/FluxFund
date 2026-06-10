package com.fluxfund.api.domain.dashboard.service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.fluxfund.api.domain.account.repository.AccountRepository;
import com.fluxfund.api.domain.dashboard.dto.DashboardSummaryResponse;
import com.fluxfund.api.domain.dashboard.dto.MonthlyCashFlowProjection;
import com.fluxfund.api.domain.dashboard.dto.MonthlyCashFlowResponse;
import com.fluxfund.api.domain.financialtransaction.FinancialTransactionStatus;
import com.fluxfund.api.domain.financialtransaction.FinancialTransactionType;
import com.fluxfund.api.domain.financialtransaction.repository.FinancialTransactionRepository;
import com.fluxfund.api.domain.fund.repository.FundRepository;
import com.fluxfund.api.domain.organization.OrganizationRepository;
import com.fluxfund.api.domain.transactionallocation.repository.TransactionAllocationRepository;
import com.fluxfund.api.security.OrganizationAccessService;
import com.fluxfund.api.shared.exception.BusinessException;
import com.fluxfund.api.shared.exception.ResourceNotFoundException;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DashboardService {

        private final OrganizationRepository organizationRepository;
        private final FinancialTransactionRepository financialTransactionRepository;
        private final TransactionAllocationRepository allocationRepository;
        private final AccountRepository accountRepository;
        private final FundRepository fundRepository;
        private final OrganizationAccessService organizationAccessService;

        public DashboardSummaryResponse getSummary(
                        UUID organizationId,
                        LocalDate startDate,
                        LocalDate endDate) {
                organizationAccessService.requireReadAccess(organizationId);

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

                BigDecimal incomeTotal = financialTransactionRepository.sumSettledAmountByTypeAndPeriod(
                                organizationId,
                                FinancialTransactionStatus.SETTLED,
                                FinancialTransactionType.INCOME,
                                resolvedStartDate,
                                resolvedEndDate);

                BigDecimal expenseTotal = financialTransactionRepository.sumSettledAmountByTypeAndPeriod(
                                organizationId,
                                FinancialTransactionStatus.SETTLED,
                                FinancialTransactionType.EXPENSE,
                                resolvedStartDate,
                                resolvedEndDate);

                BigDecimal allTimeIncomeTotal = financialTransactionRepository.sumSettledAmountByType(
                                organizationId,
                                FinancialTransactionStatus.SETTLED,
                                FinancialTransactionType.INCOME);

                BigDecimal allTimeExpenseTotal = financialTransactionRepository.sumSettledAmountByType(
                                organizationId,
                                FinancialTransactionStatus.SETTLED,
                                FinancialTransactionType.EXPENSE);

                BigDecimal accountsInitialBalance = accountRepository
                                .sumInitialBalanceByOrganizationId(organizationId);

                BigDecimal fundsInitialBalance = fundRepository
                                .sumInitialBalanceByOrganizationId(organizationId);

                BigDecimal fundsAllocationBalance = allocationRepository
                                .sumActiveFundAllocationsByOrganizationId(
                                                organizationId,
                                                FinancialTransactionStatus.CANCELED);

                BigDecimal netTotal = incomeTotal.subtract(expenseTotal);

                BigDecimal accountsTotalBalance = accountsInitialBalance
                                .add(allTimeIncomeTotal)
                                .subtract(allTimeExpenseTotal);

                BigDecimal fundsTotalBalance = fundsInitialBalance
                                .add(fundsAllocationBalance);

                long transactionCount = financialTransactionRepository
                                .countByOrganizationIdAndStatusNotAndSettlementDateBetween(
                                                organizationId,
                                                FinancialTransactionStatus.CANCELED,
                                                resolvedStartDate,
                                                resolvedEndDate);

                long unclassifiedCount = financialTransactionRepository
                                .countUnclassifiedByOrganizationId(
                                                organizationId,
                                                FinancialTransactionStatus.CANCELED);

                long unallocatedCount = financialTransactionRepository
                                .countUnallocatedByOrganizationId(
                                                organizationId,
                                                FinancialTransactionStatus.SETTLED,
                                                FinancialTransactionType.TRANSFER);

                return new DashboardSummaryResponse(
                                resolvedStartDate,
                                resolvedEndDate,
                                incomeTotal,
                                expenseTotal,
                                netTotal,
                                accountsTotalBalance,
                                fundsTotalBalance,
                                transactionCount,
                                unclassifiedCount,
                                unallocatedCount);
        }

        public List<MonthlyCashFlowResponse> getMonthlyCashFlow(
                        UUID organizationId,
                        LocalDate startDate,
                        LocalDate endDate) {
                organizationAccessService.requireReadAccess(organizationId);

                validateOrganizationExists(organizationId);

                LocalDate resolvedStartDate = startDate != null
                                ? startDate
                                : LocalDate.now().withDayOfYear(1);

                LocalDate resolvedEndDate = endDate != null
                                ? endDate
                                : LocalDate.now();

                if (resolvedEndDate.isBefore(resolvedStartDate)) {
                        throw new BusinessException("End date cannot be before start date");
                }

                List<MonthlyCashFlowProjection> rows = financialTransactionRepository.findMonthlyCashFlow(
                                organizationId,
                                resolvedStartDate,
                                resolvedEndDate);

                Map<String, MonthlyCashFlowProjection> rowsByMonth = rows.stream()
                                .collect(Collectors.toMap(
                                                MonthlyCashFlowProjection::getMonth,
                                                row -> row));

                YearMonth startMonth = YearMonth.from(resolvedStartDate);
                YearMonth endMonth = YearMonth.from(resolvedEndDate);

                DateTimeFormatter labelFormatter = DateTimeFormatter.ofPattern("MMM/yyyy",
                                Locale.forLanguageTag("pt-BR"));

                List<MonthlyCashFlowResponse> result = new java.util.ArrayList<>();

                YearMonth currentMonth = startMonth;

                while (!currentMonth.isAfter(endMonth)) {
                        String monthKey = currentMonth.toString();

                        MonthlyCashFlowProjection row = rowsByMonth.get(monthKey);

                        BigDecimal income = row != null && row.getIncome() != null
                                        ? row.getIncome()
                                        : BigDecimal.ZERO;

                        BigDecimal expense = row != null && row.getExpense() != null
                                        ? row.getExpense()
                                        : BigDecimal.ZERO;

                        BigDecimal net = income.subtract(expense);

                        String label = currentMonth.format(labelFormatter);

                        result.add(new MonthlyCashFlowResponse(
                                        monthKey,
                                        capitalize(label),
                                        income,
                                        expense,
                                        net));

                        currentMonth = currentMonth.plusMonths(1);
                }

                return result;
        }

        private void validateOrganizationExists(UUID organizationId) {
                if (!organizationRepository.existsById(organizationId)) {
                        throw new ResourceNotFoundException("Organization not found");
                }
        }

        private String capitalize(String value) {
                if (value == null || value.isBlank()) {
                        return value;
                }

                return value.substring(0, 1).toUpperCase() + value.substring(1);
        }
}
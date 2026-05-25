package com.fluxfund.api.domain.report.service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.fluxfund.api.domain.financialtransaction.FinancialTransactionType;
import com.fluxfund.api.domain.financialtransaction.repository.FinancialTransactionRepository;
import com.fluxfund.api.domain.organization.OrganizationRepository;
import com.fluxfund.api.domain.report.dto.CategoryResultReportResponse;
import com.fluxfund.api.domain.report.dto.FundReportItemResponse;
import com.fluxfund.api.domain.report.dto.FundReportResponse;
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

        private void validateOrganizationExists(UUID organizationId) {
                if (!organizationRepository.existsById(organizationId)) {
                        throw new ResourceNotFoundException("Organization not found");
                }
        }
}
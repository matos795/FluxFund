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
import com.fluxfund.api.shared.exception.BusinessException;
import com.fluxfund.api.shared.exception.ResourceNotFoundException;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ReportService {

    private final OrganizationRepository organizationRepository;
    private final FinancialTransactionRepository financialTransactionRepository;

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
                resolvedEndDate
        );

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
                items
        );
    }

    private void validateOrganizationExists(UUID organizationId) {
        if (!organizationRepository.existsById(organizationId)) {
            throw new ResourceNotFoundException("Organization not found");
        }
    }
}
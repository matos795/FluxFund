package com.fluxfund.api.domain.report.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.fluxfund.api.domain.report.dto.financialrelationship.FinancialRelationshipMonthResponse;
import com.fluxfund.api.domain.report.dto.financialrelationship.FinancialRelationshipMonthlyPartyProjection;
import com.fluxfund.api.domain.report.dto.financialrelationship.FinancialRelationshipPartyProjection;
import com.fluxfund.api.domain.report.dto.financialrelationship.FinancialRelationshipPartySummaryResponse;
import com.fluxfund.api.domain.report.dto.financialrelationship.FinancialRelationshipReportResponse;
import com.fluxfund.api.domain.transactionallocation.repository.TransactionAllocationRepository;
import com.fluxfund.api.security.OrganizationAccessService;
import com.fluxfund.api.shared.exception.BusinessException;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class FinancialRelationshipReportService {

    private final TransactionAllocationRepository allocationRepository;
    private final OrganizationAccessService organizationAccessService;

    public FinancialRelationshipReportResponse getReport(
            UUID organizationId,
            LocalDate startDate,
            LocalDate endDate) {

        organizationAccessService.requireReadAccess(organizationId);

        LocalDate resolvedEndDate = endDate != null ? endDate : LocalDate.now();

        LocalDate resolvedStartDate = startDate != null ? startDate
                : resolvedEndDate
                        .minusMonths(11)
                        .withDayOfMonth(1);

        if (resolvedStartDate.isAfter(resolvedEndDate)) {
            throw new BusinessException("Start date cannot be after end date");
        }

        List<FinancialRelationshipPartyProjection> incomeSourceProjections = allocationRepository
                .findFinancialRelationshipIncomeSources(
                        organizationId,
                        resolvedStartDate,
                        resolvedEndDate);

        List<FinancialRelationshipPartyProjection> paymentRecipientProjections = allocationRepository
                .findFinancialRelationshipPaymentRecipients(
                        organizationId,
                        resolvedStartDate,
                        resolvedEndDate);

        List<FinancialRelationshipMonthlyPartyProjection> monthlyIncomeProjections = allocationRepository
                .findFinancialRelationshipMonthlyIncomeSources(
                        organizationId,
                        resolvedStartDate,
                        resolvedEndDate);

        List<FinancialRelationshipMonthlyPartyProjection> monthlyPaymentProjections = allocationRepository
                .findFinancialRelationshipMonthlyPaymentRecipients(
                        organizationId,
                        resolvedStartDate,
                        resolvedEndDate);

        BigDecimal receivedFromPartiesTotal = sumTotalAmount(incomeSourceProjections);

        BigDecimal paidToPartiesTotal = sumTotalAmount(paymentRecipientProjections);

        Map<UUID, Integer> incomeActiveMonths = countActiveMonths(monthlyIncomeProjections);

        Map<UUID, Integer> paymentActiveMonths = countActiveMonths(monthlyPaymentProjections);

        List<FinancialRelationshipPartySummaryResponse> incomeSources = toSummaries(
                incomeSourceProjections,
                receivedFromPartiesTotal,
                incomeActiveMonths);

        List<FinancialRelationshipPartySummaryResponse> paymentRecipients = toSummaries(
                paymentRecipientProjections,
                paidToPartiesTotal,
                paymentActiveMonths);

        BigDecimal topFiveIncomeConcentrationPercentage = calculateTopConcentrationPercentage(
                incomeSourceProjections,
                receivedFromPartiesTotal,
                5);

        BigDecimal topFivePaymentConcentrationPercentage = calculateTopConcentrationPercentage(
                paymentRecipientProjections,
                paidToPartiesTotal,
                5);

        int uniqueRelationshipCount = countUniqueRelationships(
                incomeSourceProjections,
                paymentRecipientProjections);

        List<FinancialRelationshipMonthResponse> months = buildMonthlySeries(
                resolvedStartDate,
                resolvedEndDate,
                monthlyIncomeProjections,
                monthlyPaymentProjections);

        int monthCount = months.size();

        return new FinancialRelationshipReportResponse(
                resolvedStartDate,
                resolvedEndDate,
                monthCount,
                receivedFromPartiesTotal,
                paidToPartiesTotal,
                incomeSources.size(),
                paymentRecipients.size(),
                uniqueRelationshipCount,
                topFiveIncomeConcentrationPercentage,
                topFivePaymentConcentrationPercentage,
                months,
                incomeSources,
                paymentRecipients);
    }

    private BigDecimal sumTotalAmount(List<FinancialRelationshipPartyProjection> projections) {

        return projections
                .stream()
                .map(FinancialRelationshipPartyProjection::getTotalAmount)
                .filter(amount -> amount != null)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private List<FinancialRelationshipPartySummaryResponse> toSummaries(
            List<FinancialRelationshipPartyProjection> projections,
            BigDecimal totalAmount,
            Map<UUID, Integer> activeMonthsByParty) {

        return projections
                .stream()
                .map(projection -> new FinancialRelationshipPartySummaryResponse(
                        projection.getPartyId(),
                        projection.getPartyName(),
                        projection.getTotalAmount(),
                        calculatePercentage(projection.getTotalAmount(), totalAmount),
                        projection.getAllocationCount() != null ? projection.getAllocationCount() : 0L,
                        activeMonthsByParty.getOrDefault(projection.getPartyId(), 0),
                        projection.getFirstSettlementDate(),
                        projection.getLastSettlementDate()))
                .toList();
    }

    private BigDecimal calculateTopConcentrationPercentage(
            List<FinancialRelationshipPartyProjection> projections,
            BigDecimal totalAmount,
            int limit) {

        BigDecimal topAmount = projections
                .stream()
                .limit(limit)
                .map(FinancialRelationshipPartyProjection::getTotalAmount)
                .filter(amount -> amount != null)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return calculatePercentage(topAmount, totalAmount);
    }

    private BigDecimal calculatePercentage(BigDecimal amount, BigDecimal totalAmount) {

        if (amount == null || totalAmount == null || totalAmount.compareTo(BigDecimal.ZERO) == 0) {
            return BigDecimal.ZERO;
        }

        return amount
                .multiply(BigDecimal.valueOf(100))
                .divide(totalAmount, 2, RoundingMode.HALF_UP);
    }

    private int countUniqueRelationships(
            List<FinancialRelationshipPartyProjection> incomeSources,
            List<FinancialRelationshipPartyProjection> paymentRecipients) {

        Set<UUID> partyIds = new HashSet<>();

        incomeSources
                .stream()
                .map(FinancialRelationshipPartyProjection::getPartyId)
                .forEach(partyIds::add);

        paymentRecipients
                .stream()
                .map(FinancialRelationshipPartyProjection::getPartyId)
                .forEach(partyIds::add);
        return partyIds.size();
    }

    private Map<UUID, Integer> countActiveMonths(List<FinancialRelationshipMonthlyPartyProjection> projections) {

        Map<UUID, Integer> activeMonths = new HashMap<>();

        for (FinancialRelationshipMonthlyPartyProjection projection : projections) {

            activeMonths.merge(
                    projection.getPartyId(),
                    1,
                    Integer::sum);
        }

        return activeMonths;
    }

    private List<FinancialRelationshipMonthResponse> buildMonthlySeries(

            LocalDate startDate,

            LocalDate endDate,

            List<FinancialRelationshipMonthlyPartyProjection> incomeProjections,

            List<FinancialRelationshipMonthlyPartyProjection> paymentProjections) {

        Map<YearMonth, BigDecimal> incomeByMonth = sumByMonth(
                incomeProjections);

        Map<YearMonth, BigDecimal> paymentByMonth = sumByMonth(
                paymentProjections);

        YearMonth currentMonth = YearMonth.from(
                startDate);

        YearMonth endMonth = YearMonth.from(
                endDate);

        List<FinancialRelationshipMonthResponse> months = new java.util.ArrayList<>();

        while (!currentMonth.isAfter(
                endMonth)) {

            months.add(
                    new FinancialRelationshipMonthResponse(

                            currentMonth
                                    .atDay(1),

                            incomeByMonth
                                    .getOrDefault(
                                            currentMonth,
                                            BigDecimal.ZERO),

                            paymentByMonth
                                    .getOrDefault(
                                            currentMonth,
                                            BigDecimal.ZERO)));

            currentMonth = currentMonth.plusMonths(1);
        }

        return months;
    }

    private Map<YearMonth, BigDecimal> sumByMonth(

            List<FinancialRelationshipMonthlyPartyProjection> projections) {

        Map<YearMonth, BigDecimal> totals = new HashMap<>();

        for (FinancialRelationshipMonthlyPartyProjection projection : projections) {

            YearMonth month = YearMonth.of(

                    projection.getSettlementYear(),

                    projection.getSettlementMonth());

            BigDecimal amount = projection.getTotalAmount() != null

                    ? projection.getTotalAmount()

                    : BigDecimal.ZERO;

            totals.merge(

                    month,

                    amount,

                    BigDecimal::add);
        }

        return totals;
    }
}
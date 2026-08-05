package com.fluxfund.api.domain.report.service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.fluxfund.api.domain.financialcommitment.FinancialCommitment;
import com.fluxfund.api.domain.financialcommitment.FinancialCommitmentDirection;
import com.fluxfund.api.domain.financialcommitment.FinancialCommitmentRecurrence;
import com.fluxfund.api.domain.financialcommitment.mapper.FinancialCommitmentMapper;
import com.fluxfund.api.domain.financialcommitment.repository.FinancialCommitmentRepository;
import com.fluxfund.api.domain.report.dto.financialcommitment.FinancialCommitmentMonthlyItemResponse;
import com.fluxfund.api.domain.report.dto.financialcommitment.FinancialCommitmentMonthlyReportResponse;
import com.fluxfund.api.domain.report.dto.financialcommitment.FinancialCommitmentRealizationProjection;
import com.fluxfund.api.domain.report.dto.financialcommitment.FinancialCommitmentRealizationStatus;
import com.fluxfund.api.domain.transactionallocation.repository.TransactionAllocationRepository;
import com.fluxfund.api.security.OrganizationAccessService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class FinancialCommitmentReportService {

    private final FinancialCommitmentRepository commitmentRepository;

    private final TransactionAllocationRepository allocationRepository;

    private final OrganizationAccessService organizationAccessService;

    public FinancialCommitmentMonthlyReportResponse getMonthlyReport(

            UUID organizationId,

            LocalDate referenceMonth,

            FinancialCommitmentDirection direction,

            UUID partyId,

            UUID designatedRecipientId,

            UUID fundId) {

        organizationAccessService
                .requireReadAccess(
                        organizationId);

        LocalDate monthStart = referenceMonth
                .withDayOfMonth(1);

        LocalDate monthEnd = monthStart
                .withDayOfMonth(
                        monthStart
                                .lengthOfMonth());

        /*
         * Destinatário indicado pertence apenas
         * aos compromissos a receber.
         */
        UUID resolvedDesignatedRecipientId = direction == FinancialCommitmentDirection.RECEIVABLE

                ? designatedRecipientId

                : null;

        List<FinancialCommitment> commitments = commitmentRepository
                .findApplicableForMonthlyRealization(

                        organizationId,

                        direction,

                        monthStart,

                        monthEnd,

                        partyId,

                        resolvedDesignatedRecipientId,

                        fundId);

        Map<UUID, FinancialCommitmentRealizationProjection> realizationByCommitment =

                allocationRepository
                        .findFinancialCommitmentRealizations(

                                organizationId,

                                monthStart)

                        .stream()

                        .collect(
                                Collectors.toMap(

                                        FinancialCommitmentRealizationProjection::getCommitmentId,

                                        Function.identity()));

        LocalDate today = LocalDate.now();

        List<FinancialCommitmentMonthlyItemResponse> items = commitments
                .stream()

                .map(
                        commitment -> createItem(

                                commitment,

                                monthStart,

                                today,

                                realizationByCommitment
                                        .get(
                                                commitment
                                                        .getId())))

                .toList();

        BigDecimal expectedTotal = sum(
                items,
                FinancialCommitmentMonthlyItemResponse::expectedAmount);

        BigDecimal realizedTotal = sum(
                items,
                FinancialCommitmentMonthlyItemResponse::realizedAmount);

        BigDecimal pendingTotal = sum(
                items,
                FinancialCommitmentMonthlyItemResponse::pendingAmount);

        BigDecimal exceededTotal = sum(
                items,
                FinancialCommitmentMonthlyItemResponse::exceededAmount);

        return new FinancialCommitmentMonthlyReportResponse(

                monthStart,

                direction,

                expectedTotal,

                realizedTotal,

                pendingTotal,

                exceededTotal,

                items.size(),

                countStatus(
                        items,
                        FinancialCommitmentRealizationStatus.NOT_DUE),

                countStatus(
                        items,
                        FinancialCommitmentRealizationStatus.PENDING),

                countStatus(
                        items,
                        FinancialCommitmentRealizationStatus.PARTIAL),

                countStatus(
                        items,
                        FinancialCommitmentRealizationStatus.FULFILLED),

                countStatus(
                        items,
                        FinancialCommitmentRealizationStatus.EXCEEDED),

                items);
    }

    private FinancialCommitmentMonthlyItemResponse createItem(

            FinancialCommitment commitment,

            LocalDate referenceMonth,

            LocalDate today,

            FinancialCommitmentRealizationProjection realization) {

        BigDecimal expected = commitment
                .getAmount()
                .abs();

        BigDecimal realized = realization != null
                && realization
                        .getRealizedAmount() != null

                                ? realization
                                        .getRealizedAmount()
                                        .abs()

                                : BigDecimal.ZERO;

        BigDecimal pending = expected
                .subtract(
                        realized)

                .max(
                        BigDecimal.ZERO);

        BigDecimal exceeded = realized
                .subtract(
                        expected)

                .max(
                        BigDecimal.ZERO);

        LocalDate dueDate = resolveDueDate(

                commitment,

                referenceMonth);

        FinancialCommitmentRealizationStatus status = resolveStatus(

                expected,

                realized,

                dueDate,

                today);

        boolean overdue = pending.compareTo(
                BigDecimal.ZERO) > 0

                && dueDate.isBefore(
                        today);

        long allocationCount = realization != null
                && realization
                        .getAllocationCount() != null

                                ? realization
                                        .getAllocationCount()

                                : 0L;

        LocalDate lastSettlementDate = realization != null

                ? realization
                        .getLastSettlementDate()

                : null;

        return new FinancialCommitmentMonthlyItemResponse(

                FinancialCommitmentMapper
                        .toAllocationSummary(
                                commitment),

                referenceMonth,

                dueDate,

                expected,

                realized,

                pending,

                exceeded,

                status,

                overdue,

                allocationCount,

                lastSettlementDate);
    }

    private LocalDate resolveDueDate(
            FinancialCommitment commitment,
            LocalDate referenceMonth) {

        if (commitment.getRecurrence() == FinancialCommitmentRecurrence.ONE_TIME) {

            return commitment
                    .getStartDate();
        }

        int dueDay = commitment.getDueDay() != null
                ? Math.min(commitment.getDueDay(), referenceMonth.lengthOfMonth())
                : referenceMonth.lengthOfMonth();

        LocalDate dueDate = referenceMonth.withDayOfMonth(dueDay);

        YearMonth selectedMonth = YearMonth.from(referenceMonth);

        if (YearMonth.from(commitment.getStartDate()).equals(selectedMonth) && dueDate.isBefore(commitment.getStartDate())) {
            dueDate = commitment.getStartDate();
        }

        if (commitment.getEndDate() != null && YearMonth
                        .from(commitment.getEndDate())
                        .equals(selectedMonth)
                && dueDate.isAfter(commitment.getEndDate())) {

            dueDate = commitment.getEndDate();
        }

        return dueDate;
    }

    private FinancialCommitmentRealizationStatus resolveStatus(
            BigDecimal expected,
            BigDecimal realized,
            LocalDate dueDate,
            LocalDate today) {

        int comparison = realized.compareTo(expected);

        if (comparison > 0) {
            return FinancialCommitmentRealizationStatus.EXCEEDED;
        }

        if (comparison == 0) {
            return FinancialCommitmentRealizationStatus.FULFILLED;
        }

        if (realized.compareTo(BigDecimal.ZERO) > 0) {
            return FinancialCommitmentRealizationStatus.PARTIAL;
        }

        if (dueDate.isAfter(
                today)) {

            return FinancialCommitmentRealizationStatus.NOT_DUE;
        }

        return FinancialCommitmentRealizationStatus.PENDING;
    }

    private BigDecimal sum(

            List<FinancialCommitmentMonthlyItemResponse> items,

            Function<FinancialCommitmentMonthlyItemResponse, BigDecimal> extractor) {

        return items.stream()
                .map(
                        extractor)

                .reduce(
                        BigDecimal.ZERO,

                        BigDecimal::add);
    }

    private long countStatus(

            List<FinancialCommitmentMonthlyItemResponse> items,

            FinancialCommitmentRealizationStatus status) {

        return items.stream()
                .filter(
                        item -> item.status() == status)
                .count();
    }
}
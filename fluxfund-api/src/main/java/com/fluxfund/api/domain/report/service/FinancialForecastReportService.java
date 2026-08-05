package com.fluxfund.api.domain.report.service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.fluxfund.api.domain.financialcommitment.FinancialCommitment;
import com.fluxfund.api.domain.financialcommitment.FinancialCommitmentDirection;
import com.fluxfund.api.domain.financialcommitment.FinancialCommitmentRecurrence;
import com.fluxfund.api.domain.financialcommitment.repository.FinancialCommitmentRepository;
import com.fluxfund.api.domain.report.dto.forecast.FinancialForecastMonthResponse;
import com.fluxfund.api.domain.report.dto.forecast.FinancialForecastReportResponse;
import com.fluxfund.api.domain.supportagreement.SupportAgreement;
import com.fluxfund.api.domain.supportagreement.repository.SupportAgreementRepository;
import com.fluxfund.api.security.OrganizationAccessService;
import com.fluxfund.api.shared.exception.BusinessException;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class FinancialForecastReportService {

    private final FinancialCommitmentRepository financialCommitmentRepository;

    private final SupportAgreementRepository supportAgreementRepository;

    private final OrganizationAccessService organizationAccessService;

    public FinancialForecastReportResponse getForecast(

            UUID organizationId,

            LocalDate startMonth,

            Integer months,

            UUID fundId,

            boolean includeSupport) {

        organizationAccessService
                .requireReadAccess(
                        organizationId);

        int resolvedMonthCount = months != null
                ? months
                : 6;

        if (resolvedMonthCount < 1
                || resolvedMonthCount > 24) {

            throw new BusinessException(
                    "Forecast period must contain between 1 and 24 months");
        }

        /*
         * Quando nenhuma data é enviada,
         * a previsão começa no próximo mês.
         *
         * Assim não mistura um mês parcialmente
         * realizado com meses totalmente futuros.
         */
        LocalDate resolvedStartMonth = startMonth != null

                ? startMonth
                        .withDayOfMonth(1)

                : LocalDate.now()
                        .plusMonths(1)
                        .withDayOfMonth(1);

        LocalDate resolvedEndMonth = resolvedStartMonth
                .plusMonths(
                        resolvedMonthCount - 1L)

                .withDayOfMonth(1);

        LocalDate periodEnd = resolvedEndMonth
                .withDayOfMonth(
                        resolvedEndMonth
                                .lengthOfMonth());

        List<FinancialCommitment> commitments = financialCommitmentRepository
                .findActiveForForecast(

                        organizationId,

                        resolvedStartMonth,

                        periodEnd,

                        fundId);

        List<SupportAgreement> supportAgreements = includeSupport

                ? supportAgreementRepository
                        .findActiveForForecast(

                                organizationId,

                                resolvedStartMonth,

                                periodEnd,

                                fundId)

                : List.of();

        List<FinancialForecastMonthResponse> monthResponses = new ArrayList<>();

        BigDecimal cumulativeNet = BigDecimal.ZERO;

        BigDecimal lowestCumulativeNet = null;

        LocalDate lowestCumulativeMonth = null;

        for (int index = 0; index < resolvedMonthCount; index++) {

            LocalDate monthStart = resolvedStartMonth
                    .plusMonths(index);

            LocalDate monthEnd = monthStart
                    .withDayOfMonth(
                            monthStart
                                    .lengthOfMonth());

            List<FinancialCommitment> applicableReceivables =

                    commitments
                            .stream()

                            .filter(
                                    commitment -> commitment.getDirection() == FinancialCommitmentDirection.RECEIVABLE)

                            .filter(
                                    commitment -> appliesToMonth(

                                            commitment,

                                            monthStart,

                                            monthEnd))

                            .toList();

            List<FinancialCommitment> applicableGenericPayables =

                    commitments
                            .stream()

                            .filter(
                                    commitment -> commitment.getDirection() == FinancialCommitmentDirection.PAYABLE)

                            .filter(
                                    commitment -> appliesToMonth(

                                            commitment,

                                            monthStart,

                                            monthEnd))

                            .toList();

            List<SupportAgreement> applicableSupportAgreements =

                    supportAgreements
                            .stream()

                            .filter(
                                    agreement -> appliesToMonth(

                                            agreement,

                                            monthStart,

                                            monthEnd))

                            .toList();

            BigDecimal receivableAmount = sumCommitments(
                    applicableReceivables);

            BigDecimal genericPayableAmount = sumCommitments(
                    applicableGenericPayables);

            BigDecimal supportAmount = sumSupportAgreements(
                    applicableSupportAgreements);

            BigDecimal payableAmount = genericPayableAmount
                    .add(
                            supportAmount);

            BigDecimal netAmount = receivableAmount
                    .subtract(
                            payableAmount);

            cumulativeNet = cumulativeNet
                    .add(
                            netAmount);

            if (lowestCumulativeNet == null

                    || cumulativeNet.compareTo(
                            lowestCumulativeNet) < 0) {

                lowestCumulativeNet = cumulativeNet;

                lowestCumulativeMonth = monthStart;
            }

            monthResponses.add(
                    new FinancialForecastMonthResponse(

                            monthStart,

                            receivableAmount,

                            genericPayableAmount,

                            supportAmount,

                            payableAmount,

                            netAmount,

                            cumulativeNet,

                            applicableReceivables
                                    .size(),

                            applicableGenericPayables
                                    .size(),

                            applicableSupportAgreements
                                    .size()));
        }

        BigDecimal receivableTotal = monthResponses
                .stream()

                .map(
                        FinancialForecastMonthResponse::receivableAmount)

                .reduce(
                        BigDecimal.ZERO,
                        BigDecimal::add);

        BigDecimal genericPayableTotal = monthResponses
                .stream()

                .map(
                        FinancialForecastMonthResponse::genericPayableAmount)

                .reduce(
                        BigDecimal.ZERO,
                        BigDecimal::add);

        BigDecimal supportTotal = monthResponses
                .stream()

                .map(
                        FinancialForecastMonthResponse::supportAmount)

                .reduce(
                        BigDecimal.ZERO,
                        BigDecimal::add);

        BigDecimal payableTotal = genericPayableTotal
                .add(
                        supportTotal);

        BigDecimal netTotal = receivableTotal
                .subtract(
                        payableTotal);

        return new FinancialForecastReportResponse(

                resolvedStartMonth,

                resolvedEndMonth,

                resolvedMonthCount,

                includeSupport,

                receivableTotal,

                genericPayableTotal,

                supportTotal,

                payableTotal,

                netTotal,

                lowestCumulativeNet,

                lowestCumulativeMonth,

                monthResponses);
    }

    private boolean appliesToMonth(

            FinancialCommitment commitment,

            LocalDate monthStart,

            LocalDate monthEnd) {

        if (commitment.getRecurrence() == FinancialCommitmentRecurrence.ONE_TIME) {

            return !commitment
                    .getStartDate()
                    .isBefore(
                            monthStart)

                    && !commitment
                            .getStartDate()
                            .isAfter(
                                    monthEnd);
        }

        return !commitment
                .getStartDate()
                .isAfter(
                        monthEnd)

                && (commitment.getEndDate() == null

                        || !commitment
                                .getEndDate()
                                .isBefore(
                                        monthStart));
    }

    private boolean appliesToMonth(

            SupportAgreement agreement,

            LocalDate monthStart,

            LocalDate monthEnd) {

        return !agreement
                .getStartDate()
                .isAfter(
                        monthEnd)

                && (agreement.getEndDate() == null

                        || !agreement
                                .getEndDate()
                                .isBefore(
                                        monthStart));
    }

    private BigDecimal sumCommitments(

            List<FinancialCommitment> commitments) {

        return commitments
                .stream()

                .map(
                        FinancialCommitment::getAmount)

                .map(
                        BigDecimal::abs)

                .reduce(
                        BigDecimal.ZERO,
                        BigDecimal::add);
    }

    private BigDecimal sumSupportAgreements(

            List<SupportAgreement> agreements) {

        return agreements
                .stream()

                .map(
                        SupportAgreement::getAmount)

                .map(
                        BigDecimal::abs)

                .reduce(
                        BigDecimal.ZERO,
                        BigDecimal::add);
    }
}
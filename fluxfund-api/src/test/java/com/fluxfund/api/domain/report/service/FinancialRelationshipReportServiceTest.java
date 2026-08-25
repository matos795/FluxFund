package com.fluxfund.api.domain.report.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.Test;

import com.fluxfund.api.domain.financialcommitment.FinancialCommitmentDirection;
import com.fluxfund.api.domain.report.dto.financialcommitment.FinancialCommitmentMonthlyReportResponse;
import com.fluxfund.api.domain.report.dto.financialrelationship.FinancialRelationshipMonthlyPartyProjection;
import com.fluxfund.api.domain.report.dto.financialrelationship.FinancialRelationshipPartyProjection;
import com.fluxfund.api.domain.transactionallocation.repository.TransactionAllocationRepository;
import com.fluxfund.api.security.OrganizationAccessService;

class FinancialRelationshipReportServiceTest {

    private final TransactionAllocationRepository allocationRepository = mock(TransactionAllocationRepository.class);

    private final OrganizationAccessService organizationAccessService = mock(OrganizationAccessService.class);

    private final FinancialCommitmentReportService financialCommitmentReportService = mock(
            FinancialCommitmentReportService.class);

    private final FinancialRelationshipReportService service = new FinancialRelationshipReportService(
            allocationRepository,
            organizationAccessService,
            financialCommitmentReportService);

    @Test
    void shouldCalculateRelationshipTotalsFromIdentifiedParties() {

        // ARRANGE
        UUID organizationId = UUID.randomUUID();

        LocalDate startDate = LocalDate.of(2026, 8, 1);

        LocalDate endDate = LocalDate.of(2026, 8, 31);

        FinancialRelationshipPartyProjection joao = partyProjection(
                UUID.randomUUID(),
                "João",
                "1000.17");

        FinancialRelationshipPartyProjection maria = partyProjection(
                UUID.randomUUID(),
                "Maria",
                "750.32");

        FinancialRelationshipPartyProjection fornecedor = partyProjection(
                UUID.randomUUID(),
                "Fornecedor",
                "420.11");

        when(allocationRepository
                .findFinancialRelationshipIncomeSources(
                        organizationId,
                        startDate,
                        endDate))
                .thenReturn(
                        List.of(
                                joao,
                                maria));

        when(allocationRepository
                .findFinancialRelationshipPaymentRecipients(
                        organizationId,
                        startDate,
                        endDate))
                .thenReturn(
                        List.of(
                                fornecedor));

        when(allocationRepository
                .findFinancialRelationshipMonthlyIncomeSources(
                        organizationId,
                        startDate,
                        endDate))
                .thenReturn(List.of());

        when(allocationRepository
                .findFinancialRelationshipMonthlyPaymentRecipients(
                        organizationId,
                        startDate,
                        endDate))
                .thenReturn(List.of());

        when(financialCommitmentReportService
                .getMonthlyReport(
                        eq(organizationId),
                        eq(LocalDate.of(2026, 8, 1)),
                        eq(FinancialCommitmentDirection.RECEIVABLE),
                        isNull(),
                        isNull(),
                        isNull()))
                .thenReturn(
                        emptyCommitmentReport(
                                LocalDate.of(2026, 8, 1)));

        // ACT
        var report = service.getReport(
                organizationId,
                startDate,
                endDate);

        // ASSERT
        assertThat(
                report.receivedFromPartiesTotal())
                .isEqualByComparingTo(
                        "1750.49");

        assertThat(
                report.paidToPartiesTotal())
                .isEqualByComparingTo(
                        "420.11");

        assertThat(
                report.incomeSourceCount())
                .isEqualTo(2);

        assertThat(
                report.paymentRecipientCount())
                .isEqualTo(1);

        assertThat(
                report.uniqueRelationshipCount())
                .isEqualTo(3);

        assertThat(
                report.topFiveIncomeConcentrationPercentage())
                .isEqualByComparingTo(
                        "100.00");

        assertThat(
                report.topFivePaymentConcentrationPercentage())
                .isEqualByComparingTo(
                        "100.00");

        assertThat(
                report.incomeSources()
                        .get(0)
                        .sharePercentage())
                .isEqualByComparingTo(
                        "57.14");

        verify(
                organizationAccessService)
                .requireReadAccess(
                        organizationId);
    }

    @Test
    void shouldKeepRelationshipTotalsConsistentAcrossReportSections() {

        // ARRANGE
        UUID organizationId = UUID.randomUUID();

        LocalDate startDate = LocalDate.of(2026, 8, 1);

        LocalDate endDate = LocalDate.of(2026, 8, 20);

        UUID joaoId = UUID.randomUUID();

        UUID mariaId = UUID.randomUUID();

        UUID fornecedorId = UUID.randomUUID();

        var joao = partyProjection(
                joaoId,
                "João",
                "100000.17");

        var maria = partyProjection(
                mariaId,
                "Maria",
                "43728.20");

        var fornecedor = partyProjection(
                fornecedorId,
                "Fornecedor",
                "85437.91");

        var joaoAugust = monthlyProjection(
                joaoId,
                "João",
                2026,
                8,
                "100000.17");

        var mariaAugust = monthlyProjection(
                mariaId,
                "Maria",
                2026,
                8,
                "43728.20");

        var fornecedorAugust = monthlyProjection(
                fornecedorId,
                "Fornecedor",
                2026,
                8,
                "85437.91");

        when(allocationRepository
                .findFinancialRelationshipIncomeSources(
                        organizationId,
                        startDate,
                        endDate))
                .thenReturn(
                        List.of(
                                joao,
                                maria));

        when(allocationRepository
                .findFinancialRelationshipPaymentRecipients(
                        organizationId,
                        startDate,
                        endDate))
                .thenReturn(
                        List.of(
                                fornecedor));

        when(allocationRepository
                .findFinancialRelationshipMonthlyIncomeSources(
                        organizationId,
                        startDate,
                        endDate))
                .thenReturn(
                        List.of(
                                joaoAugust,
                                mariaAugust));

        when(allocationRepository
                .findFinancialRelationshipMonthlyPaymentRecipients(
                        organizationId,
                        startDate,
                        endDate))
                .thenReturn(
                        List.of(
                                fornecedorAugust));

        when(financialCommitmentReportService
                .getMonthlyReport(
                        eq(organizationId),
                        eq(LocalDate.of(2026, 8, 1)),
                        eq(FinancialCommitmentDirection.RECEIVABLE),
                        isNull(),
                        isNull(),
                        isNull()))
                .thenReturn(
                        emptyCommitmentReport(
                                LocalDate.of(2026, 8, 1)));

        // ACT
        var report = service.getReport(
                organizationId,
                startDate,
                endDate);

        // ASSERT
        BigDecimal incomeRankingTotal = report.incomeSources()
                .stream()
                .map(item -> item.totalAmount())
                .reduce(
                        BigDecimal.ZERO,
                        BigDecimal::add);

        BigDecimal paymentRankingTotal = report.paymentRecipients()
                .stream()
                .map(item -> item.totalAmount())
                .reduce(
                        BigDecimal.ZERO,
                        BigDecimal::add);

        BigDecimal incomeMonthlyTotal = report.months()
                .stream()
                .map(month -> month.receivedFromPartiesAmount())
                .reduce(
                        BigDecimal.ZERO,
                        BigDecimal::add);

        BigDecimal paymentMonthlyTotal = report.months()
                .stream()
                .map(month -> month.paidToPartiesAmount())
                .reduce(
                        BigDecimal.ZERO,
                        BigDecimal::add);

        assertThat(incomeRankingTotal)
                .isEqualByComparingTo(
                        report.receivedFromPartiesTotal());

        assertThat(incomeMonthlyTotal)
                .isEqualByComparingTo(
                        report.receivedFromPartiesTotal());

        assertThat(paymentRankingTotal)
                .isEqualByComparingTo(
                        report.paidToPartiesTotal());

        assertThat(paymentMonthlyTotal)
                .isEqualByComparingTo(
                        report.paidToPartiesTotal());
    }

    private FinancialRelationshipMonthlyPartyProjection monthlyProjection(
            UUID partyId,
            String partyName,
            int year,
            int month,
            String amount) {

        FinancialRelationshipMonthlyPartyProjection projection = mock(
                FinancialRelationshipMonthlyPartyProjection.class);

        when(projection.getPartyId())
                .thenReturn(partyId);

        when(projection.getPartyName())
                .thenReturn(partyName);

        when(projection.getSettlementYear())
                .thenReturn(year);

        when(projection.getSettlementMonth())
                .thenReturn(month);

        when(projection.getTotalAmount())
                .thenReturn(
                        new BigDecimal(amount));

        return projection;
    }

    private FinancialRelationshipPartyProjection partyProjection(
            UUID partyId,
            String partyName,
            String amount) {

        FinancialRelationshipPartyProjection projection = mock(
                FinancialRelationshipPartyProjection.class);

        when(projection.getPartyId())
                .thenReturn(partyId);

        when(projection.getPartyName())
                .thenReturn(partyName);

        when(projection.getTotalAmount())
                .thenReturn(
                        new BigDecimal(amount));

        when(projection.getAllocationCount())
                .thenReturn(1L);

        return projection;
    }

    private FinancialCommitmentMonthlyReportResponse emptyCommitmentReport(
            LocalDate referenceMonth) {

        return new FinancialCommitmentMonthlyReportResponse(
                referenceMonth,
                FinancialCommitmentDirection.RECEIVABLE,
                BigDecimal.ZERO,
                BigDecimal.ZERO,
                BigDecimal.ZERO,
                BigDecimal.ZERO,
                0L,
                0L,
                0L,
                0L,
                0L,
                0L,
                List.of());
    }
}
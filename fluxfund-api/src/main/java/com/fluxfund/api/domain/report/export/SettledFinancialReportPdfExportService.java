package com.fluxfund.api.domain.report.export;

import java.time.LocalDate;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.fluxfund.api.domain.closingdossier.export.ClosingDossierPdfGenerator;
import com.fluxfund.api.domain.organization.Organization;
import com.fluxfund.api.domain.organization.repository.OrganizationRepository;
import com.fluxfund.api.domain.report.dto.expense.SettledExpenseReportResponse;
import com.fluxfund.api.domain.report.dto.income.SettledIncomeReportResponse;
import com.fluxfund.api.domain.report.service.ReportService;
import com.fluxfund.api.shared.exception.ResourceNotFoundException;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SettledFinancialReportPdfExportService {

    private final ReportService reportService;
    private final OrganizationRepository organizationRepository;
    private final ClosingDossierPdfGenerator pdfGenerator;

    public byte[] exportSettledExpenseReport(
            UUID organizationId,
            LocalDate startDate,
            LocalDate endDate) {

        Organization organization = findOrganization(organizationId);

        SettledExpenseReportResponse report =
                reportService.getSettledExpenseReport(
                        organizationId,
                        startDate,
                        endDate);

        return pdfGenerator.generateSettledExpenseReport(
                organization,
                report);
    }

    public byte[] exportSettledIncomeReport(
            UUID organizationId,
            LocalDate startDate,
            LocalDate endDate) {

        Organization organization = findOrganization(organizationId);

        SettledIncomeReportResponse report =
                reportService.getSettledIncomeReport(
                        organizationId,
                        startDate,
                        endDate);

        return pdfGenerator.generateSettledIncomeReport(
                organization,
                report);
    }

    private Organization findOrganization(UUID organizationId) {
        return organizationRepository
                .findByIdAndActiveTrue(organizationId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Organization not found"));
    }
}
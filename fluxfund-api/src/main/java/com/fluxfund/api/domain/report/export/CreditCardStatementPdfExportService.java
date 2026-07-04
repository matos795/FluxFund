package com.fluxfund.api.domain.report.export;

import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.fluxfund.api.domain.closingdossier.export.ClosingDossierPdfGenerator;
import com.fluxfund.api.domain.organization.Organization;
import com.fluxfund.api.domain.organization.repository.OrganizationRepository;
import com.fluxfund.api.domain.report.dto.creditcardstatement.CreditCardStatementReportResponse;
import com.fluxfund.api.domain.report.service.ReportService;
import com.fluxfund.api.shared.exception.ResourceNotFoundException;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CreditCardStatementPdfExportService {

    private final ReportService reportService;
    private final OrganizationRepository organizationRepository;
    private final ClosingDossierPdfGenerator pdfGenerator;

    public byte[] exportCreditCardStatementReport(
            UUID organizationId,
            UUID statementId) {

        CreditCardStatementReportResponse report =
                reportService.getCreditCardStatementReport(
                        organizationId,
                        statementId);

        Organization organization = organizationRepository
                .findByIdAndActiveTrue(organizationId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Organization not found"));

        return pdfGenerator.generateCreditCardStatementReport(
                organization,
                report);
    }
}
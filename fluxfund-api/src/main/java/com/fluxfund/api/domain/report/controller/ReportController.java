package com.fluxfund.api.domain.report.controller;

import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.UUID;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.fluxfund.api.domain.report.dto.accountability.AccountabilityByAccountReportResponse;
import com.fluxfund.api.domain.report.dto.accountability.AccountabilityReportResponse;
import com.fluxfund.api.domain.report.dto.accountcashflow.AccountCashFlowReportResponse;
import com.fluxfund.api.domain.report.dto.category.CategoryResultReportResponse;
import com.fluxfund.api.domain.report.dto.fund.FundReportResponse;
import com.fluxfund.api.domain.report.dto.pending.PendingItemsReportResponse;
import com.fluxfund.api.domain.report.export.AccountMovementPdfExportService;
import com.fluxfund.api.domain.report.export.AccountabilityExcelExportService;
import com.fluxfund.api.domain.report.export.AccountabilityPdfExportService;
import com.fluxfund.api.domain.report.export.CreditCardStatementPdfExportService;
import com.fluxfund.api.domain.report.export.FundMovementPdfExportService;
import com.fluxfund.api.domain.report.export.SettledFinancialReportPdfExportService;
import com.fluxfund.api.domain.report.service.ReportService;

import lombok.RequiredArgsConstructor;

import static com.fluxfund.api.security.TenantHeaders.ORGANIZATION_ID;

@RestController
@RequestMapping("/api/v1/reports")
@RequiredArgsConstructor
public class ReportController {

        private final ReportService service;
        private final AccountabilityExcelExportService accountabilityExcelExportService;
        private final AccountabilityPdfExportService accountabilityPdfExportService;
        private final SettledFinancialReportPdfExportService settledFinancialReportPdfExportService;
        private final FundMovementPdfExportService fundMovementPdfExportService;
        private final AccountMovementPdfExportService accountMovementPdfExportService;
        private final CreditCardStatementPdfExportService creditCardStatementPdfExportService;

        @GetMapping("/category-result")
        public ResponseEntity<CategoryResultReportResponse> getCategoryResultReport(
                        @RequestHeader(ORGANIZATION_ID) UUID organizationId,

                        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,

                        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {

                return ResponseEntity.ok(
                                service.getCategoryResultReport(
                                                organizationId,
                                                startDate,
                                                endDate));
        }

        @GetMapping("/funds")
        public ResponseEntity<FundReportResponse> getFundReport(
                        @RequestHeader(ORGANIZATION_ID) UUID organizationId,
                        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
                        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
                return ResponseEntity.ok(service.getFundReport(organizationId, startDate, endDate));
        }

        @GetMapping("/accountability")
        public ResponseEntity<AccountabilityReportResponse> getAccountabilityReport(
                        @RequestHeader(ORGANIZATION_ID) UUID organizationId,
                        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
                        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
                return ResponseEntity.ok(
                                service.getAccountabilityReport(organizationId, startDate, endDate));
        }

        @GetMapping("/accountability/by-account")
        public ResponseEntity<AccountabilityByAccountReportResponse> getAccountabilityReportByAccount(
                        @RequestHeader(ORGANIZATION_ID) UUID organizationId,
                        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
                        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
                return ResponseEntity.ok(
                                service.getAccountabilityReportByAccount(organizationId, startDate, endDate));
        }

        @GetMapping("/accountability/export.xlsx")
        public ResponseEntity<byte[]> exportAccountabilityReportExcel(
                        @RequestHeader(ORGANIZATION_ID) UUID organizationId,
                        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
                        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
                byte[] file = accountabilityExcelExportService.exportAccountabilityReport(
                                organizationId,
                                startDate,
                                endDate);

                String filename = "prestacao-contas.xlsx";

                return ResponseEntity.ok()
                                .contentType(MediaType.parseMediaType(
                                                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                                .header(
                                                HttpHeaders.CONTENT_DISPOSITION,
                                                ContentDisposition.attachment()
                                                                .filename(filename)
                                                                .build()
                                                                .toString())
                                .body(file);
        }

        @GetMapping(value = "/accountability/export.pdf", produces = MediaType.APPLICATION_PDF_VALUE)
        public ResponseEntity<byte[]> exportAccountabilityReportPdf(
                        @RequestHeader(ORGANIZATION_ID) UUID organizationId,
                        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
                        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {

                LocalDate resolvedStartDate = startDate != null
                                ? startDate
                                : LocalDate.now().withDayOfMonth(1);

                LocalDate resolvedEndDate = endDate != null
                                ? endDate
                                : LocalDate.now();

                byte[] file = accountabilityPdfExportService
                                .exportAccountabilityReport(
                                                organizationId,
                                                resolvedStartDate,
                                                resolvedEndDate);

                String filename = "prestacao-contas-%s-a-%s.pdf"
                                .formatted(
                                                resolvedStartDate,
                                                resolvedEndDate);

                return ResponseEntity.ok()
                                .contentType(MediaType.APPLICATION_PDF)
                                .header(
                                                HttpHeaders.CONTENT_DISPOSITION,
                                                ContentDisposition.attachment()
                                                                .filename(
                                                                                filename,
                                                                                StandardCharsets.UTF_8)
                                                                .build()
                                                                .toString())
                                .body(file);
        }

        @GetMapping(value = "/settled-expenses/export.pdf", produces = MediaType.APPLICATION_PDF_VALUE)
        public ResponseEntity<byte[]> exportSettledExpenseReportPdf(
                        @RequestHeader(ORGANIZATION_ID) UUID organizationId,
                        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
                        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {

                LocalDate resolvedStartDate = startDate != null
                                ? startDate
                                : LocalDate.now().withDayOfMonth(1);

                LocalDate resolvedEndDate = endDate != null
                                ? endDate
                                : LocalDate.now();

                byte[] file = settledFinancialReportPdfExportService
                                .exportSettledExpenseReport(
                                                organizationId,
                                                resolvedStartDate,
                                                resolvedEndDate);

                String filename = "despesas-reconhecidas-%s-a-%s.pdf"
                                .formatted(
                                                resolvedStartDate,
                                                resolvedEndDate);

                return ResponseEntity.ok()
                                .contentType(MediaType.APPLICATION_PDF)
                                .header(
                                                HttpHeaders.CONTENT_DISPOSITION,
                                                ContentDisposition.attachment()
                                                                .filename(
                                                                                filename,
                                                                                StandardCharsets.UTF_8)
                                                                .build()
                                                                .toString())
                                .body(file);
        }

        @GetMapping(value = "/settled-incomes/export.pdf", produces = MediaType.APPLICATION_PDF_VALUE)
        public ResponseEntity<byte[]> exportSettledIncomeReportPdf(
                        @RequestHeader(ORGANIZATION_ID) UUID organizationId,
                        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
                        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {

                LocalDate resolvedStartDate = startDate != null
                                ? startDate
                                : LocalDate.now().withDayOfMonth(1);

                LocalDate resolvedEndDate = endDate != null
                                ? endDate
                                : LocalDate.now();

                byte[] file = settledFinancialReportPdfExportService
                                .exportSettledIncomeReport(
                                                organizationId,
                                                resolvedStartDate,
                                                resolvedEndDate);

                String filename = "receitas-liquidadas-%s-a-%s.pdf"
                                .formatted(
                                                resolvedStartDate,
                                                resolvedEndDate);

                return ResponseEntity.ok()
                                .contentType(MediaType.APPLICATION_PDF)
                                .header(
                                                HttpHeaders.CONTENT_DISPOSITION,
                                                ContentDisposition.attachment()
                                                                .filename(
                                                                                filename,
                                                                                StandardCharsets.UTF_8)
                                                                .build()
                                                                .toString())
                                .body(file);
        }

        @GetMapping(value = "/fund-movement/export.pdf", produces = MediaType.APPLICATION_PDF_VALUE)
        public ResponseEntity<byte[]> exportFundMovementReportPdf(
                        @RequestHeader(ORGANIZATION_ID) UUID organizationId,
                        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
                        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {

                LocalDate resolvedStartDate = startDate != null
                                ? startDate
                                : LocalDate.now().withDayOfMonth(1);

                LocalDate resolvedEndDate = endDate != null
                                ? endDate
                                : LocalDate.now();

                byte[] file = fundMovementPdfExportService
                                .exportFundMovementReport(
                                                organizationId,
                                                resolvedStartDate,
                                                resolvedEndDate);

                String filename = "movimentacao-por-fundos-%s-a-%s.pdf"
                                .formatted(
                                                resolvedStartDate,
                                                resolvedEndDate);

                return ResponseEntity.ok()
                                .contentType(MediaType.APPLICATION_PDF)
                                .header(
                                                HttpHeaders.CONTENT_DISPOSITION,
                                                ContentDisposition.attachment()
                                                                .filename(
                                                                                filename,
                                                                                StandardCharsets.UTF_8)
                                                                .build()
                                                                .toString())
                                .body(file);
        }

        @GetMapping(value = "/account-movement/export.pdf", produces = MediaType.APPLICATION_PDF_VALUE)
        public ResponseEntity<byte[]> exportAccountMovementReportPdf(
                        @RequestHeader(ORGANIZATION_ID) UUID organizationId,
                        @RequestParam UUID accountId,
                        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
                        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {

                LocalDate resolvedStartDate = startDate != null
                                ? startDate
                                : LocalDate.now().withDayOfMonth(1);

                LocalDate resolvedEndDate = endDate != null
                                ? endDate
                                : LocalDate.now();

                byte[] file = accountMovementPdfExportService
                                .exportAccountMovementReport(
                                                organizationId,
                                                accountId,
                                                resolvedStartDate,
                                                resolvedEndDate);

                String filename = "movimentacao-conta-%s-a-%s.pdf"
                                .formatted(
                                                resolvedStartDate,
                                                resolvedEndDate);

                return ResponseEntity.ok()
                                .contentType(MediaType.APPLICATION_PDF)
                                .header(
                                                HttpHeaders.CONTENT_DISPOSITION,
                                                ContentDisposition.attachment()
                                                                .filename(
                                                                                filename,
                                                                                StandardCharsets.UTF_8)
                                                                .build()
                                                                .toString())
                                .body(file);
        }

        @GetMapping(value = "/credit-card-statements/{statementId}/export.pdf", produces = MediaType.APPLICATION_PDF_VALUE)
        public ResponseEntity<byte[]> exportCreditCardStatementReportPdf(
                        @RequestHeader(ORGANIZATION_ID) UUID organizationId,
                        @PathVariable UUID statementId) {

                byte[] file = creditCardStatementPdfExportService
                                .exportCreditCardStatementReport(
                                                organizationId,
                                                statementId);

                String filename = "fatura-cartao-%s.pdf"
                                .formatted(statementId);

                return ResponseEntity.ok()
                                .contentType(MediaType.APPLICATION_PDF)
                                .header(
                                                HttpHeaders.CONTENT_DISPOSITION,
                                                ContentDisposition.attachment()
                                                                .filename(
                                                                                filename,
                                                                                StandardCharsets.UTF_8)
                                                                .build()
                                                                .toString())
                                .body(file);
        }

        @GetMapping("/pending-items")
        public ResponseEntity<PendingItemsReportResponse> getPendingItemsReport(
                        @RequestHeader(ORGANIZATION_ID) UUID organizationId,
                        @RequestParam(required = false, defaultValue = "10") Integer limit) {

                return ResponseEntity.ok(
                                service.getPendingItemsReport(organizationId, limit));
        }

        @GetMapping("/account-cash-flow")
        public ResponseEntity<AccountCashFlowReportResponse> getAccountCashFlowReport(
                        @RequestHeader(ORGANIZATION_ID) UUID organizationId,
                        @RequestParam(required = false) LocalDate startDate,
                        @RequestParam(required = false) LocalDate endDate) {

                return ResponseEntity.ok(
                                service.getAccountCashFlowReport(
                                                organizationId,
                                                startDate,
                                                endDate));
        }
}
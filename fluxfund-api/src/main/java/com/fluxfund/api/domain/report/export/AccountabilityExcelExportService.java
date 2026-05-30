package com.fluxfund.api.domain.report.export;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.UUID;
import java.util.stream.Collectors;

import org.apache.poi.ss.usermodel.BorderStyle;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellStyle;
import org.apache.poi.ss.usermodel.DataFormat;
import org.apache.poi.ss.usermodel.FillPatternType;
import org.apache.poi.ss.usermodel.Font;
import org.apache.poi.ss.usermodel.HorizontalAlignment;
import org.apache.poi.ss.usermodel.IndexedColors;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.ss.util.CellRangeAddress;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;

import com.fluxfund.api.domain.report.dto.accountability.AccountabilityAccountBreakdownResponse;
import com.fluxfund.api.domain.report.dto.accountability.AccountabilityByAccountItemResponse;
import com.fluxfund.api.domain.report.dto.accountability.AccountabilityByAccountReportResponse;
import com.fluxfund.api.domain.report.service.ReportService;
import com.fluxfund.api.security.OrganizationAccessService;
import com.fluxfund.api.shared.exception.BusinessException;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AccountabilityExcelExportService {

    private final ReportService reportService;
    private final OrganizationAccessService organizationAccessService;

    public byte[] exportAccountabilityReport(
            UUID organizationId,
            LocalDate startDate,
            LocalDate endDate) {
            organizationAccessService.requireReadAccess(organizationId);

        AccountabilityByAccountReportResponse report = reportService.getAccountabilityReportByAccount(organizationId,
                startDate, endDate);

        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream outputStream = new ByteArrayOutputStream()) {
            ExcelStyles styles = createStyles(workbook);

            createSummarySheet(workbook, report, styles);
            createFundsSheet(workbook, report, styles);
            createAccountsSheet(workbook, report, styles);

            workbook.write(outputStream);

            return outputStream.toByteArray();
        } catch (IOException exception) {
            throw new BusinessException("Could not generate accountability Excel report");
        }
    }

    private void createSummarySheet(
            Workbook workbook,
            AccountabilityByAccountReportResponse report,
            ExcelStyles styles) {
        Sheet sheet = workbook.createSheet("Resumo");

        int rowIndex = 0;

        Row titleRow = sheet.createRow(rowIndex++);
        Cell titleCell = titleRow.createCell(0);
        titleCell.setCellValue("Prestação de Contas - Resumo por Favorecido");
        titleCell.setCellStyle(styles.titleStyle());

        Row periodRow = sheet.createRow(rowIndex++);
        Cell periodCell = periodRow.createCell(0);
        periodCell.setCellValue("Período: " + report.startDate() + " até " + report.endDate());
        periodCell.setCellStyle(styles.subtitleStyle());

        rowIndex++;

        Row totalHeaderRow = sheet.createRow(rowIndex++);
        createHeaderCell(totalHeaderRow, 0, "Compromissos", styles);
        createHeaderCell(totalHeaderRow, 1, "Ofertas Destinadas", styles);
        createHeaderCell(totalHeaderRow, 2, "Total Devido", styles);
        createHeaderCell(totalHeaderRow, 3, "Repassado", styles);
        createHeaderCell(totalHeaderRow, 4, "A Repassar", styles);

        Row totalRow = sheet.createRow(rowIndex++);
        createMoneyCell(totalRow, 0, report.commitmentTotal(), styles);
        createMoneyCell(totalRow, 1, report.allocatedTotal(), styles);
        createMoneyCell(totalRow, 2, report.payableTotal(), styles);
        createMoneyCell(totalRow, 3, report.transferredTotal(), styles);
        createMoneyCell(totalRow, 4, report.pendingTotal(), styles);

        rowIndex++;

        Row headerRow = sheet.createRow(rowIndex++);
        createHeaderCell(headerRow, 0, "Favorecido", styles);
        createHeaderCell(headerRow, 1, "Compromissos", styles);
        createHeaderCell(headerRow, 2, "Ofertas Destinadas", styles);
        createHeaderCell(headerRow, 3, "Total Devido", styles);
        createHeaderCell(headerRow, 4, "Repassado", styles);
        createHeaderCell(headerRow, 5, "A Repassar", styles);

        var groupedByBeneficiary = report.items()
                .stream()
                .collect(Collectors.groupingBy(
                        AccountabilityByAccountItemResponse::beneficiaryId,
                        LinkedHashMap::new,
                        Collectors.toList()));

        for (var beneficiaryItems : groupedByBeneficiary.values()) {
            AccountabilityByAccountItemResponse first = beneficiaryItems.get(0);

            BigDecimal commitmentAmount = beneficiaryItems.stream()
                    .map(AccountabilityByAccountItemResponse::commitmentAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            BigDecimal allocatedAmount = beneficiaryItems.stream()
                    .map(AccountabilityByAccountItemResponse::allocatedAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            BigDecimal payableAmount = beneficiaryItems.stream()
                    .map(AccountabilityByAccountItemResponse::payableAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            BigDecimal transferredAmount = beneficiaryItems.stream()
                    .map(AccountabilityByAccountItemResponse::transferredAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            BigDecimal pendingAmount = beneficiaryItems.stream()
                    .map(AccountabilityByAccountItemResponse::pendingAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            Row row = sheet.createRow(rowIndex++);
            createTextCell(row, 0, first.beneficiaryName(), styles);
            createMoneyCell(row, 1, commitmentAmount, styles);
            createMoneyCell(row, 2, allocatedAmount, styles);
            createMoneyCell(row, 3, payableAmount, styles);
            createMoneyCell(row, 4, transferredAmount, styles);
            createMoneyCell(row, 5, pendingAmount, styles);
        }

        applySheetDefaults(sheet, 6);
    }

    private void createFundsSheet(
            Workbook workbook,
            AccountabilityByAccountReportResponse report,
            ExcelStyles styles
    ) {
        Sheet sheet = workbook.createSheet("Fundos por Favorecido");

        int rowIndex = 0;

        Row titleRow = sheet.createRow(rowIndex++);
        Cell titleCell = titleRow.createCell(0);
        titleCell.setCellValue("Prestação de Contas - Fundos por Favorecido");
        titleCell.setCellStyle(styles.titleStyle());

        Row periodRow = sheet.createRow(rowIndex++);
        Cell periodCell = periodRow.createCell(0);
        periodCell.setCellValue("Período: " + report.startDate() + " até " + report.endDate());
        periodCell.setCellStyle(styles.subtitleStyle());

        rowIndex++;

        Row headerRow = sheet.createRow(rowIndex++);
        createHeaderCell(headerRow, 0, "Favorecido", styles);
        createHeaderCell(headerRow, 1, "Fundo", styles);
        createHeaderCell(headerRow, 2, "Compromisso Fixo", styles);
        createHeaderCell(headerRow, 3, "Ofertas Destinadas", styles);
        createHeaderCell(headerRow, 4, "Total Devido", styles);
        createHeaderCell(headerRow, 5, "Repassado", styles);
        createHeaderCell(headerRow, 6, "A Repassar", styles);
        createHeaderCell(headerRow, 7, "Qtd. Alocações", styles);

        for (AccountabilityByAccountItemResponse item : report.items()) {
            Row row = sheet.createRow(rowIndex++);

            createTextCell(row, 0, item.beneficiaryName(), styles);
            createTextCell(row, 1, item.fundName(), styles);
            createMoneyCell(row, 2, item.commitmentAmount(), styles);
            createMoneyCell(row, 3, item.allocatedAmount(), styles);
            createMoneyCell(row, 4, item.payableAmount(), styles);
            createMoneyCell(row, 5, item.transferredAmount(), styles);
            createMoneyCell(row, 6, item.pendingAmount(), styles);
            createNumberCell(row, 7, item.allocationCount(), styles);
        }

        applySheetDefaults(sheet, 8);
    }

    private void createAccountsSheet(
            Workbook workbook,
            AccountabilityByAccountReportResponse report,
            ExcelStyles styles
    ) {
        Sheet sheet = workbook.createSheet("Detalhamento por Banco");

        int rowIndex = 0;

        Row titleRow = sheet.createRow(rowIndex++);
        Cell titleCell = titleRow.createCell(0);
        titleCell.setCellValue("Prestação de Contas - Detalhamento por Banco");
        titleCell.setCellStyle(styles.titleStyle());

        Row periodRow = sheet.createRow(rowIndex++);
        Cell periodCell = periodRow.createCell(0);
        periodCell.setCellValue("Período: " + report.startDate() + " até " + report.endDate());
        periodCell.setCellStyle(styles.subtitleStyle());

        rowIndex++;

        Row headerRow = sheet.createRow(rowIndex++);
        createHeaderCell(headerRow, 0, "Favorecido", styles);
        createHeaderCell(headerRow, 1, "Fundo", styles);
        createHeaderCell(headerRow, 2, "Conta", styles);
        createHeaderCell(headerRow, 3, "Banco", styles);
        createHeaderCell(headerRow, 4, "Ofertas Destinadas", styles);
        createHeaderCell(headerRow, 5, "Repassado", styles);
        createHeaderCell(headerRow, 6, "Saldo no Banco", styles);
        createHeaderCell(headerRow, 7, "Qtd. Alocações", styles);

        for (AccountabilityByAccountItemResponse item : report.items()) {
            for (AccountabilityAccountBreakdownResponse account : item.accounts()) {
                Row row = sheet.createRow(rowIndex++);

                createTextCell(row, 0, item.beneficiaryName(), styles);
                createTextCell(row, 1, item.fundName(), styles);
                createTextCell(row, 2, account.accountName(), styles);
                createTextCell(row, 3, account.bankName(), styles);
                createMoneyCell(row, 4, account.allocatedAmount(), styles);
                createMoneyCell(row, 5, account.transferredAmount(), styles);
                createMoneyCell(row, 6, account.pendingAmount(), styles);
                createNumberCell(row, 7, account.allocationCount(), styles);
            }
        }

        applySheetDefaults(sheet, 8);
    }

    private ExcelStyles createStyles(Workbook workbook) {
        Font titleFont = workbook.createFont();
        titleFont.setBold(true);
        titleFont.setFontHeightInPoints((short) 16);

        CellStyle titleStyle = workbook.createCellStyle();
        titleStyle.setFont(titleFont);

        Font subtitleFont = workbook.createFont();
        subtitleFont.setFontHeightInPoints((short) 11);
        subtitleFont.setColor(IndexedColors.GREY_50_PERCENT.getIndex());

        CellStyle subtitleStyle = workbook.createCellStyle();
        subtitleStyle.setFont(subtitleFont);

        Font headerFont = workbook.createFont();
        headerFont.setBold(true);
        headerFont.setColor(IndexedColors.WHITE.getIndex());

        CellStyle headerStyle = workbook.createCellStyle();
        headerStyle.setFont(headerFont);
        headerStyle.setFillForegroundColor(IndexedColors.DARK_BLUE.getIndex());
        headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        headerStyle.setAlignment(HorizontalAlignment.CENTER);
        setThinBorders(headerStyle);

        CellStyle textStyle = workbook.createCellStyle();
        setThinBorders(textStyle);

        DataFormat dataFormat = workbook.createDataFormat();

        CellStyle moneyStyle = workbook.createCellStyle();
        moneyStyle.setDataFormat(dataFormat.getFormat("R$ #,##0.00"));
        setThinBorders(moneyStyle);

        CellStyle numberStyle = workbook.createCellStyle();
        numberStyle.setDataFormat(dataFormat.getFormat("#,##0"));
        setThinBorders(numberStyle);

        return new ExcelStyles(
                titleStyle,
                subtitleStyle,
                headerStyle,
                textStyle,
                moneyStyle,
                numberStyle
        );
    }

    private void createHeaderCell(Row row, int columnIndex, String value, ExcelStyles styles) {
        Cell cell = row.createCell(columnIndex);
        cell.setCellValue(value);
        cell.setCellStyle(styles.headerStyle());
    }

    private void createTextCell(Row row, int columnIndex, String value, ExcelStyles styles) {
        Cell cell = row.createCell(columnIndex);
        cell.setCellValue(value != null ? value : "");
        cell.setCellStyle(styles.textStyle());
    }

    private void createMoneyCell(Row row, int columnIndex, BigDecimal value, ExcelStyles styles) {
        Cell cell = row.createCell(columnIndex);
        cell.setCellValue(value != null ? value.doubleValue() : 0);
        cell.setCellStyle(styles.moneyStyle());
    }

    private void createNumberCell(Row row, int columnIndex, long value, ExcelStyles styles) {
        Cell cell = row.createCell(columnIndex);
        cell.setCellValue(value);
        cell.setCellStyle(styles.numberStyle());
    }

    private void applySheetDefaults(Sheet sheet, int numberOfColumns) {
        sheet.createFreezePane(0, 4);
        sheet.setAutoFilter(new CellRangeAddress(
                3,
                3,
                0,
                numberOfColumns - 1
        ));

        for (int columnIndex = 0; columnIndex < numberOfColumns; columnIndex++) {
            sheet.autoSizeColumn(columnIndex);
            sheet.setColumnWidth(
                    columnIndex,
                    Math.min(sheet.getColumnWidth(columnIndex) + 1000, 18000)
            );
        }
    }

    private void setThinBorders(CellStyle style) {
        style.setBorderTop(BorderStyle.THIN);
        style.setBorderRight(BorderStyle.THIN);
        style.setBorderBottom(BorderStyle.THIN);
        style.setBorderLeft(BorderStyle.THIN);
    }

    private record ExcelStyles(
            CellStyle titleStyle,
            CellStyle subtitleStyle,
            CellStyle headerStyle,
            CellStyle textStyle,
            CellStyle moneyStyle,
            CellStyle numberStyle
    ) {
    }
}

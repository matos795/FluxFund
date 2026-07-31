package com.fluxfund.api.domain.financialtransaction.export;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Objects;
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
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.fluxfund.api.domain.attachment.Attachment;
import com.fluxfund.api.domain.attachment.AttachmentType;
import com.fluxfund.api.domain.attachment.repository.AttachmentRepository;
import com.fluxfund.api.domain.financialtransaction.FinancialTransaction;
import com.fluxfund.api.domain.financialtransaction.FinancialTransactionType;
import com.fluxfund.api.domain.financialtransaction.repository.FinancialTransactionRepository;
import com.fluxfund.api.domain.organization.repository.OrganizationRepository;
import com.fluxfund.api.domain.transactionallocation.TransactionAllocation;
import com.fluxfund.api.security.OrganizationAccessService;
import com.fluxfund.api.shared.exception.BusinessException;
import com.fluxfund.api.shared.exception.ResourceNotFoundException;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class FinancialTransactionExcelExportService {

    private static final Logger log = LoggerFactory.getLogger(FinancialTransactionExcelExportService.class);

    private final FinancialTransactionRepository financialTransactionRepository;
    private final AttachmentRepository attachmentRepository;
    private final OrganizationRepository organizationRepository;
    private final OrganizationAccessService organizationAccessService;

    public byte[] exportSettledTransactions(
            UUID organizationId,
            LocalDate startDate,
            LocalDate endDate) {
        organizationAccessService.requireReadAccess(organizationId);

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

        log.debug("Exporting settled transactions for organizationId={}, startDate={}, endDate={}",
                organizationId, resolvedStartDate, resolvedEndDate);

        List<FinancialTransaction> transactions = financialTransactionRepository.findSettledIncomeAndExpenseForExport(
                organizationId,
                resolvedStartDate,
                resolvedEndDate);

        log.debug("Fetched {} transactions for export (organizationId={})", transactions.size(), organizationId);

        Map<UUID, List<Attachment>> attachmentsByTransactionId = loadAttachmentsByTransactionId(organizationId,
                transactions);

        log.debug("Loaded attachments for {} transactions (organizationId={})",
                attachmentsByTransactionId.size(), organizationId);

        List<FinancialTransaction> receivedTransactions = transactions.stream()
                .filter(transaction -> transaction.getType() == FinancialTransactionType.INCOME)
                .sorted(transactionComparator())
                .toList();

        List<FinancialTransaction> paidTransactions = transactions.stream()
                .filter(transaction -> transaction.getType() == FinancialTransactionType.EXPENSE)
                .sorted(transactionComparator())
                .toList();

        log.debug("Split into {} income and {} expense transactions (organizationId={})",
                receivedTransactions.size(), paidTransactions.size(), organizationId);

        try (Workbook workbook = new XSSFWorkbook();
                ByteArrayOutputStream outputStream = new ByteArrayOutputStream()) {

            ExcelStyles styles = createStyles(workbook);

            log.debug("Creating summary sheet (organizationId={})", organizationId);
            createSummarySheet(
                    workbook,
                    receivedTransactions,
                    paidTransactions,
                    resolvedStartDate,
                    resolvedEndDate,
                    styles);

            log.debug("Creating 'Contas Recebidas' sheet with {} rows (organizationId={})",
                    receivedTransactions.size(), organizationId);
            createTransactionsSheet(
                    workbook,
                    "Contas Recebidas",
                    receivedTransactions,
                    true,
                    attachmentsByTransactionId,
                    styles);

            log.debug("Creating 'Contas Pagas' sheet with {} rows (organizationId={})",
                    paidTransactions.size(), organizationId);
            createTransactionsSheet(
                    workbook,
                    "Contas Pagas",
                    paidTransactions,
                    false,
                    attachmentsByTransactionId,
                    styles);

            log.debug("Creating 'Todas as Transações' sheet with {} rows (organizationId={})",
                    transactions.size(), organizationId);
            createAllTransactionsSheet(
                    workbook,
                    transactions.stream().sorted(transactionComparator()).toList(),
                    attachmentsByTransactionId,
                    styles);

            workbook.write(outputStream);

            log.debug("Excel export completed successfully (organizationId={})", organizationId);
            return outputStream.toByteArray();
        } catch (IOException exception) {
            log.error("IOException while generating settled transactions Excel export for organizationId={}: {}",
                    organizationId, exception.getMessage(), exception);
            throw new BusinessException("Could not generate settled transactions Excel export");
        } catch (Exception exception) {
            log.error("Unexpected error while generating settled transactions Excel export for organizationId={}: {}",
                    organizationId, exception.getMessage(), exception);
            throw new BusinessException("Could not generate settled transactions Excel export");
        }
    }

    private Map<UUID, List<Attachment>> loadAttachmentsByTransactionId(
            UUID organizationId,
            List<FinancialTransaction> transactions) {
        List<UUID> transactionIds = transactions.stream()
                .map(FinancialTransaction::getId)
                .toList();

        if (transactionIds.isEmpty()) {
            return Map.of();
        }

        return attachmentRepository
                .findAllByTransactionIdsForExport(organizationId, transactionIds)
                .stream()
                .collect(Collectors.groupingBy(
                        attachment -> attachment.getFinancialTransaction().getId()));
    }

    private void createSummarySheet(
            Workbook workbook,
            List<FinancialTransaction> receivedTransactions,
            List<FinancialTransaction> paidTransactions,
            LocalDate startDate,
            LocalDate endDate,
            ExcelStyles styles) {
        Sheet sheet = workbook.createSheet("Resumo");

        BigDecimal receivedTotal = receivedTransactions.stream()
                .map(this::getAbsoluteSettledAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal paidTotal = paidTransactions.stream()
                .map(this::getAbsoluteSettledAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal netTotal = receivedTotal.subtract(paidTotal);

        int rowIndex = 0;

        Row titleRow = sheet.createRow(rowIndex++);
        Cell titleCell = titleRow.createCell(0);
        titleCell.setCellValue("Movimento Financeiro - Contas Recebidas e Pagas");
        titleCell.setCellStyle(styles.titleStyle());

        Row periodRow = sheet.createRow(rowIndex++);
        Cell periodCell = periodRow.createCell(0);
        periodCell.setCellValue("Período: " + startDate + " até " + endDate);
        periodCell.setCellStyle(styles.subtitleStyle());

        rowIndex++;

        Row headerRow = sheet.createRow(rowIndex++);
        createHeaderCell(headerRow, 0, "Indicador", styles);
        createHeaderCell(headerRow, 1, "Valor", styles);
        createHeaderCell(headerRow, 2, "Quantidade", styles);

        Row receivedRow = sheet.createRow(rowIndex++);
        createTextCell(receivedRow, 0, "Contas Recebidas", styles);
        createMoneyCell(receivedRow, 1, receivedTotal, styles);
        createNumberCell(receivedRow, 2, receivedTransactions.size(), styles);

        Row paidRow = sheet.createRow(rowIndex++);
        createTextCell(paidRow, 0, "Contas Pagas", styles);
        createMoneyCell(paidRow, 1, paidTotal, styles);
        createNumberCell(paidRow, 2, paidTransactions.size(), styles);

        Row netRow = sheet.createRow(rowIndex++);
        createTextCell(netRow, 0, "Resultado", styles);
        createMoneyCell(netRow, 1, netTotal, styles);
        createNumberCell(netRow, 2, receivedTransactions.size() + paidTransactions.size(), styles);

        applySheetDefaults(sheet, 3, 3);
    }

    private void createTransactionsSheet(
            Workbook workbook,
            String sheetName,
            List<FinancialTransaction> transactions,
            boolean incomeSheet,
            Map<UUID, List<Attachment>> attachmentsByTransactionId,
            ExcelStyles styles) {
        Sheet sheet = workbook.createSheet(sheetName);

        int rowIndex = 0;

        Row titleRow = sheet.createRow(rowIndex++);
        Cell titleCell = titleRow.createCell(0);
        titleCell.setCellValue(sheetName);
        titleCell.setCellStyle(styles.titleStyle());

        rowIndex++;

        Row headerRow = sheet.createRow(rowIndex++);

        createHeaderCell(headerRow, 0, "Vencimento", styles);
        createHeaderCell(headerRow, 1, incomeSheet ? "Recebimento" : "Pagamento", styles);
        createHeaderCell(headerRow, 2, "Mês Referência", styles);
        createHeaderCell(headerRow, 3, "Ano", styles);
        createHeaderCell(headerRow, 4, "Descrição", styles);
        createHeaderCell(headerRow, 5, incomeSheet ? "Origem da receita / pagador" : "Fornecedor / recebedor", styles);
        createHeaderCell(headerRow, 6, "Valor", styles);
        createHeaderCell(headerRow, 7, "Conta Contábil", styles);
        createHeaderCell(headerRow, 8, "Conta Corrente", styles);
        createHeaderCell(headerRow, 9, "Status", styles);
        createHeaderCell(headerRow, 10, "Banco", styles);
        createHeaderCell(headerRow, 11, "Fundos", styles);
        createHeaderCell(headerRow, 12, "Comprovante Pgto?", styles);
        createHeaderCell(headerRow, 13, "Anexo Fiscal?", styles);
        createHeaderCell(headerRow, 14, "Tipos de Anexo", styles);
        createHeaderCell(headerRow, 15, "Origem", styles);
        createHeaderCell(headerRow, 16, "Descrição Original", styles);
        createHeaderCell(headerRow, 17, "Documento", styles);
        createHeaderCell(headerRow, 18, "ID", styles);

        for (FinancialTransaction transaction : transactions) {
            UUID transactionId = transaction.getId();
            log.debug("Processing transaction id={} for sheet '{}'", transactionId, sheetName);

            List<Attachment> attachments = attachmentsByTransactionId.getOrDefault(
                    transactionId,
                    List.of());

            try {
                Row row = sheet.createRow(rowIndex++);

                createDateCell(row, 0, transaction.getDueDate(), styles);
                createDateCell(row, 1, transaction.getSettlementDate(), styles);
                createDateCell(row, 2, getReferenceMonth(transaction), styles);
                createNumberCell(row, 3, getReferenceYear(transaction), styles);
                createTextCell(row, 4, getDescription(transaction), styles);
                createTextCell(row, 5, getFinancialCounterpartyNames(transaction), styles);
                createMoneyCell(row, 6, getAbsoluteSettledAmount(transaction), styles);
                createTextCell(row, 7, getCategoryName(transaction), styles);
                createTextCell(row, 8, getAccountName(transaction), styles);
                createTextCell(row, 9, "Efetivado", styles);
                createTextCell(row, 10, getBankName(transaction), styles);
                createTextCell(row, 11, getFundNames(transaction), styles);
                createTextCell(row, 12, hasPaymentProof(attachments) ? "Sim" : "Não", styles);
                createTextCell(row, 13, hasFiscalAttachment(attachments) ? "Sim" : "Não", styles);
                createTextCell(row, 14, getAttachmentTypeNames(attachments), styles);
                createTextCell(row, 15, getSourceName(transaction), styles);
                createTextCell(row, 16, transaction.getRawDescription(), styles);
                createTextCell(row, 17, transaction.getDocumentNumber(), styles);
                createTextCell(row, 18, transactionId != null ? transactionId.toString() : "", styles);

                if (!incomeSheet && !hasFiscalAttachment(attachments)) {
                    row.getCell(13).setCellStyle(styles.warningStyle());
                }
            } catch (Exception exception) {
                log.error("Error processing transaction id={} in sheet '{}': {}",
                        transactionId, sheetName, exception.getMessage(), exception);
                throw exception;
            }
        }

        applySheetDefaults(sheet, 19, 2);
    }

    private void createAllTransactionsSheet(
            Workbook workbook,
            List<FinancialTransaction> transactions,
            Map<UUID, List<Attachment>> attachmentsByTransactionId,
            ExcelStyles styles) {
        Sheet sheet = workbook.createSheet("Todas as Transações");

        int rowIndex = 0;

        Row titleRow = sheet.createRow(rowIndex++);
        Cell titleCell = titleRow.createCell(0);
        titleCell.setCellValue("Todas as Transações Baixadas");
        titleCell.setCellStyle(styles.titleStyle());

        rowIndex++;

        Row headerRow = sheet.createRow(rowIndex++);

        createHeaderCell(headerRow, 0, "Tipo", styles);
        createHeaderCell(headerRow, 1, "Vencimento", styles);
        createHeaderCell(headerRow, 2, "Pagamento/Recebimento", styles);
        createHeaderCell(headerRow, 3, "Mês Referência", styles);
        createHeaderCell(headerRow, 4, "Ano", styles);
        createHeaderCell(headerRow, 5, "Descrição", styles);
        createHeaderCell(headerRow, 6, "Contato financeiro principal", styles);
        createHeaderCell(headerRow, 7, "Valor", styles);
        createHeaderCell(headerRow, 8, "Conta Contábil", styles);
        createHeaderCell(headerRow, 9, "Conta Corrente", styles);
        createHeaderCell(headerRow, 10, "Status", styles);
        createHeaderCell(headerRow, 11, "Banco", styles);
        createHeaderCell(headerRow, 12, "Fundos", styles);
        createHeaderCell(headerRow, 13, "Comprovante Pgto?", styles);
        createHeaderCell(headerRow, 14, "Anexo Fiscal?", styles);
        createHeaderCell(headerRow, 15, "Tipos de Anexo", styles);
        createHeaderCell(headerRow, 16, "Origem do lançamento", styles);
        createHeaderCell(headerRow, 17, "Descrição Original", styles);
        createHeaderCell(headerRow, 18, "Documento", styles);
        createHeaderCell(headerRow, 19, "ID", styles);

        for (FinancialTransaction transaction : transactions) {
            UUID transactionId = transaction.getId();
            log.debug("Processing transaction id={} for sheet 'Todas as Transações'", transactionId);

            List<Attachment> attachments = attachmentsByTransactionId.getOrDefault(
                    transactionId,
                    List.of());

            try {
                Row row = sheet.createRow(rowIndex++);

                createTextCell(row, 0, translateType(transaction.getType()), styles);
                createDateCell(row, 1, transaction.getDueDate(), styles);
                createDateCell(row, 2, transaction.getSettlementDate(), styles);
                createDateCell(row, 3, getReferenceMonth(transaction), styles);
                createNumberCell(row, 4, getReferenceYear(transaction), styles);
                createTextCell(row, 5, getDescription(transaction), styles);
                createTextCell(row, 6, getFinancialCounterpartyNames(transaction), styles);
                createMoneyCell(row, 7, getAbsoluteSettledAmount(transaction), styles);
                createTextCell(row, 8, getCategoryName(transaction), styles);
                createTextCell(row, 9, getAccountName(transaction), styles);
                createTextCell(row, 10, "Efetivado", styles);
                createTextCell(row, 11, getBankName(transaction), styles);
                createTextCell(row, 12, getFundNames(transaction), styles);
                createTextCell(row, 13, hasPaymentProof(attachments) ? "Sim" : "Não", styles);
                createTextCell(row, 14, hasFiscalAttachment(attachments) ? "Sim" : "Não", styles);
                createTextCell(row, 15, getAttachmentTypeNames(attachments), styles);
                createTextCell(row, 16, getSourceName(transaction), styles);
                createTextCell(row, 17, transaction.getRawDescription(), styles);
                createTextCell(row, 18, transaction.getDocumentNumber(), styles);
                createTextCell(row, 19, transactionId != null ? transactionId.toString() : "", styles);

                if (transaction.getType() == FinancialTransactionType.EXPENSE
                        && !hasFiscalAttachment(attachments)) {
                    row.getCell(14).setCellStyle(styles.warningStyle());
                }
            } catch (Exception exception) {
                log.error("Error processing transaction id={} in sheet 'Todas as Transações': {}",
                        transactionId, exception.getMessage(), exception);
                throw exception;
            }
        }

        applySheetDefaults(sheet, 20, 2);
    }

    private Comparator<FinancialTransaction> transactionComparator() {
        return Comparator
                .comparing(
                        FinancialTransaction::getSettlementDate,
                        Comparator.nullsLast(Comparator.naturalOrder()))
                .thenComparing(
                        FinancialTransaction::getCreatedAt,
                        Comparator.nullsLast(Comparator.naturalOrder()));
    }

    private LocalDate getReferenceMonth(FinancialTransaction transaction) {
        LocalDate baseDate = transaction.getSettlementDate() != null
                ? transaction.getSettlementDate()
                : transaction.getDueDate();

        if (baseDate == null) {
            return null;
        }

        return baseDate.withDayOfMonth(1);
    }

    private long getReferenceYear(FinancialTransaction transaction) {
        LocalDate baseDate = transaction.getSettlementDate() != null
                ? transaction.getSettlementDate()
                : transaction.getDueDate();

        return baseDate != null ? baseDate.getYear() : 0;
    }

    private BigDecimal getAbsoluteSettledAmount(FinancialTransaction transaction) {
        if (transaction.getSettledAmount() != null) {
            return transaction.getSettledAmount().abs();
        }

        return BigDecimal.ZERO;
    }

    private String getAccountName(FinancialTransaction transaction) {
        return transaction.getAccount() != null
                ? transaction.getAccount().getName()
                : "";
    }

    private String getBankName(FinancialTransaction transaction) {
        if (transaction.getAccount() == null) {
            return "";
        }

        return transaction.getAccount().getBankName() != null
                ? transaction.getAccount().getBankName()
                : "";
    }

    private String getCategoryName(FinancialTransaction transaction) {
        return transaction.getCategory() != null
                ? transaction.getCategory().getName()
                : "";
    }

    private String getDescription(FinancialTransaction transaction) {
        if (transaction.getDescription() != null && !transaction.getDescription().isBlank()) {
            return transaction.getDescription();
        }

        return transaction.getRawDescription() != null
                ? transaction.getRawDescription()
                : "";
    }

    private String getFundNames(FinancialTransaction transaction) {
        List<TransactionAllocation> allocations = transaction.getAllocations();
        if (allocations == null) {
            return "";
        }
        return allocations.stream()
                .map(TransactionAllocation::getFund)
                .filter(fund -> fund != null)
                .map(fund -> fund.getName())
                .filter(name -> name != null)
                .distinct()
                .collect(Collectors.joining(", "));
    }

    private String getFinancialCounterpartyNames(
            FinancialTransaction transaction) {

        List<TransactionAllocation> allocations = transaction.getAllocations();

        if (allocations == null) {
            return "";
        }

        return allocations
                .stream()
                .map(allocation -> transaction.getType() == FinancialTransactionType.INCOME
                                ? allocation.getSourceParty()
                                : allocation.getRecipientParty())
                .filter(Objects::nonNull)
                .map(financialParty -> financialParty.getName())
                .filter(Objects::nonNull)
                .distinct()
                .collect(Collectors.joining(", "));
    }

    private boolean hasPaymentProof(List<Attachment> attachments) {
        return attachments.stream()
                .filter(attachment -> attachment.getType() != null)
                .anyMatch(attachment -> attachment.getType() == AttachmentType.PROOF_OF_PAYMENT);
    }

    private boolean hasFiscalAttachment(List<Attachment> attachments) {
        return attachments.stream()
                .filter(attachment -> attachment.getType() != null)
                .anyMatch(attachment -> attachment.getType() != AttachmentType.PROOF_OF_PAYMENT);
    }

    private String getAttachmentTypeNames(List<Attachment> attachments) {
        return attachments.stream()
                .filter(attachment -> attachment.getType() != null)
                .map(attachment -> attachment.getType().name())
                .distinct()
                .collect(Collectors.joining(", "));
    }

    private String getSourceName(FinancialTransaction transaction) {
        return transaction.getSource() != null ? transaction.getSource().name() : "";
    }

    private String translateType(FinancialTransactionType type) {
        if (type == FinancialTransactionType.INCOME) {
            return "Receita";
        }

        if (type == FinancialTransactionType.EXPENSE) {
            return "Despesa";
        }

        return "Transferência";
    }

    private void validateOrganizationExists(UUID organizationId) {
        if (!organizationRepository.existsById(organizationId)) {
            throw new ResourceNotFoundException("Organization not found");
        }
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
        textStyle.setWrapText(true);
        setThinBorders(textStyle);

        DataFormat dataFormat = workbook.createDataFormat();

        CellStyle moneyStyle = workbook.createCellStyle();
        moneyStyle.setDataFormat(dataFormat.getFormat("R$ #,##0.00"));
        setThinBorders(moneyStyle);

        CellStyle dateStyle = workbook.createCellStyle();
        dateStyle.setDataFormat(dataFormat.getFormat("dd/mm/yyyy"));
        setThinBorders(dateStyle);

        CellStyle numberStyle = workbook.createCellStyle();
        numberStyle.setDataFormat(dataFormat.getFormat("#,##0"));
        setThinBorders(numberStyle);

        Font warningFont = workbook.createFont();
        warningFont.setBold(true);
        warningFont.setColor(IndexedColors.DARK_RED.getIndex());

        CellStyle warningStyle = workbook.createCellStyle();
        warningStyle.cloneStyleFrom(textStyle);
        warningStyle.setFillForegroundColor(IndexedColors.LIGHT_YELLOW.getIndex());
        warningStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        warningStyle.setFont(warningFont);

        return new ExcelStyles(
                titleStyle,
                subtitleStyle,
                headerStyle,
                textStyle,
                moneyStyle,
                dateStyle,
                numberStyle,
                warningStyle);
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

    private void createDateCell(Row row, int columnIndex, LocalDate value, ExcelStyles styles) {
        Cell cell = row.createCell(columnIndex);

        if (value != null) {
            cell.setCellValue(value);
        } else {
            cell.setBlank();
        }

        cell.setCellStyle(styles.dateStyle());
    }

    private void createNumberCell(Row row, int columnIndex, long value, ExcelStyles styles) {
        Cell cell = row.createCell(columnIndex);
        cell.setCellValue(value);
        cell.setCellStyle(styles.numberStyle());
    }

    private static final int[] SUMMARY_COLUMN_WIDTHS = {
            38, 18, 14
    };

    private static final int[] TRANSACTION_COLUMN_WIDTHS = {
            14, // Vencimento
            16, // Recebimento/Pagamento
            18, // Mês Referência
            10, // Ano
            42, // Descrição
            30, // Pagador/Favorecido
            16, // Valor
            28, // Conta Contábil
            26, // Conta Corrente
            14, // Status
            20, // Banco
            30, // Fundos
            20, // Comprovante Pgto?
            18, // Anexo Fiscal?
            26, // Tipos de Anexo
            16, // Origem
            42, // Descrição Original
            22, // Documento
            38 // ID
    };

    private static final int[] ALL_TRANSACTIONS_COLUMN_WIDTHS = {
            14, // Tipo
            14, // Vencimento
            22, // Pagamento/Recebimento
            18, // Mês Referência
            10, // Ano
            42, // Descrição
            30, // Favorecido/Pagador
            16, // Valor
            28, // Conta Contábil
            26, // Conta Corrente
            14, // Status
            20, // Banco
            30, // Fundos
            20, // Comprovante Pgto?
            18, // Anexo Fiscal?
            26, // Tipos de Anexo
            16, // Origem
            42, // Descrição Original
            22, // Documento
            38 // ID
    };

    private void applySheetDefaults(Sheet sheet, int numberOfColumns, int headerRowIndex) {
        sheet.createFreezePane(0, headerRowIndex + 1);

        sheet.setAutoFilter(new CellRangeAddress(
                headerRowIndex,
                headerRowIndex,
                0,
                numberOfColumns - 1));

        int[] widths = resolveColumnWidths(numberOfColumns);

        for (int columnIndex = 0; columnIndex < numberOfColumns; columnIndex++) {
            int widthInChars = columnIndex < widths.length
                    ? widths[columnIndex]
                    : 18;

            sheet.setColumnWidth(columnIndex, toExcelWidth(widthInChars));
        }
    }

    private int[] resolveColumnWidths(int numberOfColumns) {
        if (numberOfColumns == 3) {
            return SUMMARY_COLUMN_WIDTHS;
        }

        if (numberOfColumns == 19) {
            return TRANSACTION_COLUMN_WIDTHS;
        }

        if (numberOfColumns == 20) {
            return ALL_TRANSACTIONS_COLUMN_WIDTHS;
        }

        return new int[numberOfColumns];
    }

    private int toExcelWidth(int characters) {
        return Math.min(characters * 256, 18000);
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
            CellStyle dateStyle,
            CellStyle numberStyle,
            CellStyle warningStyle) {
    }
}
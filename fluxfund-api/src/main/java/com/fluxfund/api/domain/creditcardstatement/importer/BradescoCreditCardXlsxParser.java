package com.fluxfund.api.domain.creditcardstatement.importer;

import java.io.InputStream;
import java.math.BigDecimal;
import java.security.MessageDigest;
import java.text.Normalizer;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.HexFormat;
import java.util.List;

import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.DateUtil;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.WorkbookFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import com.fluxfund.api.shared.exception.BusinessException;
import com.fluxfund.api.shared.importer.ImportedTransactionRow;

@Component
public class BradescoCreditCardXlsxParser {

    public List<ImportedTransactionRow> parse(MultipartFile file) {
        validateFile(file);

        try (InputStream inputStream = file.getInputStream();
                var workbook = WorkbookFactory.create(inputStream)) {

            var sheet = workbook.getSheet("Extrato Fechado");

            if (sheet == null) {
                sheet = workbook.getSheetAt(0);
            }

            int headerRowIndex = findHeaderRow(sheet);

            if (headerRowIndex < 0) {
                throw new BusinessException("Não foi possível encontrar o cabeçalho de lançamentos da fatura.");
            }

            List<ImportedTransactionRow> rows = new ArrayList<>();

            for (int rowIndex = headerRowIndex + 1; rowIndex <= sheet.getLastRowNum(); rowIndex++) {
                Row row = sheet.getRow(rowIndex);

                if (row == null) {
                    continue;
                }

                String firstText = readString(row.getCell(1));

                if (isSectionBreak(firstText)) {
                    break;
                }

                LocalDate date = readDate(row.getCell(1));

                if (date == null) {
                    continue;
                }

                String description = readString(row.getCell(2));

                if (description == null || description.isBlank()) {
                    continue;
                }

                BigDecimal amount = readBigDecimal(row.getCell(7));

                if (amount == null) {
                    continue;
                }

                String normalizedDescription = normalizeDescription(description);
                String externalId = buildExternalId(date, normalizedDescription, amount, rowIndex);

                rows.add(new ImportedTransactionRow(
                        date,
                        normalizedDescription,
                        amount.abs(),
                        externalId,
                        null));
            }

            return rows;
        } catch (BusinessException exception) {
            throw exception;
        } catch (Exception exception) {
            throw new BusinessException("Não foi possível ler a planilha Bradesco: " + exception.getMessage());
        }
    }

    private void validateFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BusinessException("Arquivo da fatura é obrigatório.");
        }

        String filename = file.getOriginalFilename();

        if (filename == null || !filename.toLowerCase().endsWith(".xlsx")) {
            throw new BusinessException("Arquivo da fatura Bradesco deve ser .xlsx.");
        }
    }

    private int findHeaderRow(org.apache.poi.ss.usermodel.Sheet sheet) {
        for (int rowIndex = 0; rowIndex <= sheet.getLastRowNum(); rowIndex++) {
            Row row = sheet.getRow(rowIndex);

            if (row == null) {
                continue;
            }

            String first = readString(row.getCell(1));
            String second = readString(row.getCell(2));
            String valueInBrl = readString(row.getCell(7));

            if ("Data da transação".equalsIgnoreCase(first)
                    && "Lançamentos".equalsIgnoreCase(second)
                    && "Valor em R$".equalsIgnoreCase(valueInBrl)) {
                return rowIndex;
            }
        }

        return -1;
    }

    private LocalDate readDate(Cell cell) {
        if (cell == null) {
            return null;
        }

        if (cell.getCellType() == org.apache.poi.ss.usermodel.CellType.NUMERIC
                && DateUtil.isCellDateFormatted(cell)) {
            return cell.getDateCellValue()
                    .toInstant()
                    .atZone(ZoneId.systemDefault())
                    .toLocalDate();
        }

        if (cell.getCellType() == org.apache.poi.ss.usermodel.CellType.NUMERIC) {
            return DateUtil.getJavaDate(cell.getNumericCellValue())
                    .toInstant()
                    .atZone(ZoneId.systemDefault())
                    .toLocalDate();
        }

        return null;
    }

    private String readString(Cell cell) {
        if (cell == null) {
            return null;
        }

        return switch (cell.getCellType()) {
            case STRING -> cell.getStringCellValue().trim();
            case NUMERIC -> BigDecimal.valueOf(cell.getNumericCellValue()).stripTrailingZeros().toPlainString();
            case BOOLEAN -> String.valueOf(cell.getBooleanCellValue());
            case FORMULA -> cell.getCellFormula();
            default -> null;
        };
    }

    private BigDecimal readBigDecimal(Cell cell) {
        if (cell == null) {
            return null;
        }

        if (cell.getCellType() == org.apache.poi.ss.usermodel.CellType.NUMERIC) {
            return BigDecimal.valueOf(cell.getNumericCellValue());
        }

        String text = readString(cell);

        if (text == null || text.isBlank()) {
            return null;
        }

        String normalized = text
                .replace("R$", "")
                .replace(".", "")
                .replace(",", ".")
                .trim();

        try {
            return new BigDecimal(normalized);
        } catch (NumberFormatException exception) {
            return null;
        }
    }

    private boolean isSectionBreak(String value) {
        if (value == null) {
            return false;
        }

        String normalized = normalizeText(value);

        return normalized.contains("taxas")
                || normalized.contains("encargos")
                || normalized.contains("custo efetivo")
                || normalized.contains("total dos lancamentos");
    }

    private String normalizeDescription(String value) {
        return value
                .replace("\r", " ")
                .replace("\n", " ")
                .replaceAll("\\s+", " ")
                .trim();
    }

    private String normalizeText(String value) {
        String normalized = Normalizer.normalize(value, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "");

        return normalized.toLowerCase().trim();
    }

    private String buildExternalId(
            LocalDate date,
            String description,
            BigDecimal amount,
            int rowIndex) {

        String base = "BRADESCO_CARD_XLSX|%s|%s|%s|%d"
                .formatted(date, description, amount.stripTrailingZeros().toPlainString(), rowIndex);

        return "BRADESCO_CARD_XLSX:" + sha256(base);
    }

    private String sha256(String value) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(value.getBytes(java.nio.charset.StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (Exception exception) {
            throw new BusinessException("Não foi possível gerar identificador da linha importada.");
        }
    }
}
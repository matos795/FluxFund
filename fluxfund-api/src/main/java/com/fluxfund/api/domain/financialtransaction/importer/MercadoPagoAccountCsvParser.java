package com.fluxfund.api.domain.financialtransaction.importer;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import com.fluxfund.api.shared.exception.BusinessException;
import com.fluxfund.api.shared.importer.ImportedTransactionRow;

@Component
public class MercadoPagoAccountCsvParser {

    private static final DateTimeFormatter DATE_FORMAT =
            DateTimeFormatter.ofPattern("dd-MM-yyyy");

    public List<ImportedTransactionRow> parse(MultipartFile file) {
        validateFile(file);

        List<ImportedTransactionRow> rows = new ArrayList<>();

        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8))) {

            String line;
            boolean insideTransactions = false;

            while ((line = reader.readLine()) != null) {
                if (line.isBlank()) {
                    continue;
                }

                if (line.startsWith("RELEASE_DATE;TRANSACTION_TYPE;REFERENCE_ID;")) {
                    insideTransactions = true;
                    continue;
                }

                if (!insideTransactions) {
                    continue;
                }

                String[] columns = line.split(";", -1);

                if (columns.length < 5) {
                    continue;
                }

                LocalDate date = LocalDate.parse(columns[0].trim(), DATE_FORMAT);
                String description = columns[1].trim();
                String referenceId = columns[2].trim();
                BigDecimal amount = parseDecimal(columns[3]);

                if (referenceId.isBlank()) {
                    throw new BusinessException("Linha do Mercado Pago sem REFERENCE_ID.");
                }

                rows.add(new ImportedTransactionRow(
                        date,
                        description,
                        amount,
                        "MERCADO_PAGO:" + referenceId,
                        referenceId
                ));
            }

            return rows;
        } catch (BusinessException exception) {
            throw exception;
        } catch (Exception exception) {
            throw new BusinessException("Não foi possível ler o CSV do Mercado Pago: " + exception.getMessage());
        }
    }

    private void validateFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BusinessException("CSV file is required");
        }

        String filename = file.getOriginalFilename();

        if (filename == null || !filename.toLowerCase().endsWith(".csv")) {
            throw new BusinessException("File must be a CSV file");
        }
    }

    private BigDecimal parseDecimal(String value) {
        String normalized = value
                .replace(".", "")
                .replace(",", ".")
                .trim();

        return new BigDecimal(normalized);
    }
}
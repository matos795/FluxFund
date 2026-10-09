package com.fluxfund.api.domain.creditcardstatement.importer;

import static org.assertj.core.api.Assertions.assertThat;

import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.sql.Date;
import java.time.LocalDate;

import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;

class BradescoCreditCardXlsxParserTest {

    private final BradescoCreditCardXlsxParser parser = new BradescoCreditCardXlsxParser();

    @Test
    void shouldPreserveNegativeCreditAmount() throws Exception {

        byte[] content;

        try (
                XSSFWorkbook workbook = new XSSFWorkbook();

                ByteArrayOutputStream output = new ByteArrayOutputStream()) {

            var sheet = workbook.createSheet("Extrato Fechado");

            var header = sheet.createRow(0);

            header.createCell(1).setCellValue("Data da transação");
            header.createCell(2).setCellValue("Lançamentos");
            header.createCell(7).setCellValue("Valor em R$");

            var expense = sheet.createRow(1);

            expense.createCell(1)
                    .setCellValue(
                            Date.valueOf(
                                    LocalDate.of(
                                            2026,
                                            8,
                                            10)));

            expense.createCell(2).setCellValue("COMPRA TESTE");

            expense.createCell(7).setCellValue(100.00);

            var credit = sheet.createRow(2);

            credit.createCell(1)
                    .setCellValue(
                            Date.valueOf(
                                    LocalDate.of(
                                            2026,
                                            8,
                                            11)));

            credit.createCell(2).setCellValue("ESTORNO TESTE");

            credit.createCell(7).setCellValue(-27.90);

            workbook.write(output);

            content = output.toByteArray();
        }

        MockMultipartFile file = new MockMultipartFile(
                "file",
                "fatura-bradesco.xlsx",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                content);

        var rows = parser.parse(file);

        assertThat(rows)
                .hasSize(2);

        assertThat(
                rows.get(0).amount())
                .isEqualByComparingTo(
                        new BigDecimal("100.00"));

        assertThat(
                rows.get(1).amount())
                .isEqualByComparingTo(
                        new BigDecimal("-27.90"));
    }
}
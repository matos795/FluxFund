package com.fluxfund.api.domain.closingdossier.export;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.text.Normalizer;
import java.text.NumberFormat;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;

import org.apache.pdfbox.Loader;
import org.apache.pdfbox.multipdf.PDFMergerUtility;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.font.PDFont;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.font.Standard14Fonts;
import org.apache.pdfbox.pdmodel.graphics.image.PDImageXObject;
import org.springframework.stereotype.Service;

import com.fluxfund.api.domain.attachment.Attachment;
import com.fluxfund.api.domain.attachment.AttachmentType;
import com.fluxfund.api.domain.closingdossier.dto.ClosingDossierPreviewRequest;
import com.fluxfund.api.domain.closingdossier.dto.ClosingDossierPreviewResponse;
import com.fluxfund.api.domain.financialtransaction.FinancialTransaction;
import com.fluxfund.api.domain.financialtransaction.FinancialTransactionType;
import com.fluxfund.api.domain.organization.Organization;
import com.fluxfund.api.shared.exception.BusinessException;
import com.fluxfund.api.shared.storage.LocalFileStorageService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ClosingDossierPdfGenerator {

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    private static final NumberFormat CURRENCY_FORMATTER = NumberFormat.getCurrencyInstance(new Locale("pt", "BR"));

    private final LocalFileStorageService storageService;

    public byte[] generate(
            Organization organization,
            ClosingDossierPreviewRequest request,
            ClosingDossierPreviewResponse preview,
            List<ClosingDossierExportAccount> accounts) {

        try (
                PDDocument document = new PDDocument();
                ByteArrayOutputStream outputStream = new ByteArrayOutputStream()) {

            PdfWriter writer = new PdfWriter(document);

            writeGeneralCover(
                    writer,
                    organization,
                    request,
                    preview,
                    accounts.size());

            for (ClosingDossierExportAccount accountData : accounts) {
                writeAccountSection(
                        document,
                        writer,
                        accountData,
                        request);
            }

            writer.close();

            document.save(outputStream);

            return outputStream.toByteArray();

        } catch (IOException exception) {
            throw new BusinessException(
                    "Could not generate closing dossier PDF");
        }
    }

    private void writeGeneralCover(
            PdfWriter writer,
            Organization organization,
            ClosingDossierPreviewRequest request,
            ClosingDossierPreviewResponse preview,
            int includedAccountCount) throws IOException {

        writer.startCoverPage(
                "FLUXFUND",
                "Dossiê de Fechamento",
                List.of(
                        "Organização: " + organization.getName(),
                        "Período: " + formatPeriod(
                                request.periodStartDate(),
                                request.periodEndDate()),
                        "Gerado em: " + formatDate(OffsetDateTime.now().toLocalDate()),
                        "Contas incluídas: " + includedAccountCount,
                        "Movimentações: " + preview.totalTransactionCount(),
                        "Pendências de extrato: "
                                + preview.accountsWithoutBankStatementCount(),
                        "Pendências de comprovante: "
                                + preview.expensesWithoutPaymentProofCount(),
                        "Pendências fiscais: "
                                + preview.expensesWithoutFiscalDocumentCount()));

        writer.closeCurrentPage();
    }

    private void writeAccountSection(
            PDDocument document,
            PdfWriter writer,
            ClosingDossierExportAccount accountData,
            ClosingDossierPreviewRequest request) throws IOException {

        var account = accountData.account();
        var preview = accountData.preview();

        writer.startCoverPage(
                "CONTA",
                account.getName(),
                List.of(
                        "Período: " + formatPeriod(
                                request.periodStartDate(),
                                request.periodEndDate()),
                        "Movimentações: " + preview.transactionCount(),
                        "Receitas: " + formatCurrency(preview.incomeTotal()),
                        "Despesas: " + formatCurrency(preview.expenseTotal()),
                        "Transferências: " + formatCurrency(preview.transferTotal()),
                        "Extrato oficial: "
                                + (preview.hasBankStatement()
                                        ? "Disponível"
                                        : "Pendente"),
                        "Comprovantes pendentes: "
                                + preview.paymentProofIssues().size(),
                        "Documentos fiscais pendentes: "
                                + preview.fiscalDocumentIssues().size()));

        writer.closeCurrentPage();

        appendBankStatements(document, writer, accountData);

        writeTransactionList(writer, accountData.transactions());

        for (FinancialTransaction transaction : accountData.transactions()) {
            if (transaction.getType() != FinancialTransactionType.EXPENSE) {
                continue;
            }

            writeExpenseSection(
                    document,
                    writer,
                    transaction,
                    accountData.getAttachments(transaction));
        }
    }

    private void appendBankStatements(
            PDDocument document,
            PdfWriter writer,
            ClosingDossierExportAccount accountData) throws IOException {

        if (accountData.bankStatementDocuments().isEmpty()) {
            return;
        }

        for (var statement : accountData.bankStatementDocuments()) {
            appendPdfFromStorage(
                    document,
                    writer,
                    statement.getStorageKey(),
                    statement.getOriginalFilename());
        }
    }

    private void writeTransactionList(
            PdfWriter writer,
            List<FinancialTransaction> transactions) throws IOException {

        writer.startPage();
        writer.writeSectionTitle("Lista de transações");

        if (transactions.isEmpty()) {
            writer.writeParagraph(
                    "Nenhuma movimentação encontrada para os filtros selecionados.");
            writer.closeCurrentPage();
            return;
        }

        for (FinancialTransaction transaction : transactions) {
            String description = getTransactionDescription(transaction);

            writer.writeSmallLine(
                    formatDate(transaction.getSettlementDate())
                            + " | "
                            + getTransactionTypeLabel(transaction.getType())
                            + " | "
                            + formatCurrency(getTransactionAmount(transaction)));

            writer.writeParagraph(description);
            writer.writeDivider();
        }

        writer.closeCurrentPage();
    }

    private void writeExpenseSection(
            PDDocument document,
            PdfWriter writer,
            FinancialTransaction transaction,
            List<Attachment> attachments) throws IOException {

        List<Attachment> sortedAttachments = sortAttachments(attachments);

        writer.startPage();
        writer.writeSectionTitle("Despesa");

        writer.writeMetric(
                "Data",
                formatDate(transaction.getSettlementDate()));

        writer.writeMetric(
                "Valor",
                formatCurrency(getTransactionAmount(transaction)));

        writer.writeMetric(
                "Categoria",
                transaction.getCategory() != null
                        ? transaction.getCategory().getName()
                        : "Sem categoria");

        writer.writeParagraph(
                "Descrição: " + getTransactionDescription(transaction));

        if (transaction.getRawDescription() != null
                && !transaction.getRawDescription().isBlank()
                && !transaction.getRawDescription().equals(
                        transaction.getDescription())) {

            writer.writeParagraph(
                    "Descrição original: " + transaction.getRawDescription());
        }

        if (sortedAttachments.isEmpty()) {
            writer.writeParagraph(
                    "Nenhum documento foi vinculado a esta despesa.");

            writer.closeCurrentPage();
            return;
        }

        writer.writeParagraph(
                "Documentos incluídos a seguir:");

        for (Attachment attachment : sortedAttachments) {
            writer.writeParagraph(
                    "- "
                            + getAttachmentTypeLabel(attachment.getType())
                            + ": "
                            + attachment.getOriginalFilename());
        }

        writer.closeCurrentPage();

        for (Attachment attachment : sortedAttachments) {
            appendAttachment(document, writer, attachment);
        }
    }

    private List<Attachment> sortAttachments(
            List<Attachment> attachments) {

        return attachments.stream()
                .sorted(Comparator
                        .comparingInt(this::getAttachmentOrder)
                        .thenComparing(Attachment::getUploadedAt))
                .toList();
    }

    private void appendAttachment(
            PDDocument document,
            PdfWriter writer,
            Attachment attachment) throws IOException {

        if (isPdf(attachment)) {
            appendPdfFromStorage(
                    document,
                    writer,
                    attachment.getStorageKey(),
                    attachment.getOriginalFilename());

            return;
        }

        if (isSupportedImage(attachment)) {
            appendImageFromStorage(writer, attachment);
            return;
        }

        writer.startPage();
        writer.writeSectionTitle("Arquivo não incorporado");

        writer.writeParagraph(
                "Arquivo: " + attachment.getOriginalFilename());

        writer.writeParagraph(
                "Tipo: " + getAttachmentTypeLabel(attachment.getType()));

        writer.writeParagraph(
                "O formato deste arquivo ainda não é suportado no Dossiê.");

        writer.closeCurrentPage();
    }

    private void appendPdfFromStorage(
            PDDocument destination,
            PdfWriter writer,
            String storageKey,
            String filename) throws IOException {

        writer.closeCurrentPage();

        try (PDDocument source = Loader.loadPDF(storageService.read(storageKey))) {
            PDFMergerUtility merger = new PDFMergerUtility();
            merger.appendDocument(destination, source);

        } catch (IOException | RuntimeException exception) {
            writer.startPage();
            writer.writeSectionTitle("Arquivo não incorporado");
            writer.writeParagraph(
                    "Não foi possível incorporar o arquivo: " + filename);
            writer.writeParagraph(
                    "Verifique se o PDF está disponível, não possui senha e não está corrompido.");
            writer.closeCurrentPage();
        }
    }

    private void appendImageFromStorage(
            PdfWriter writer,
            Attachment attachment) throws IOException {

        try {
            byte[] imageBytes = storageService.read(
                    attachment.getStorageKey());

            writer.writeImagePage(
                    imageBytes,
                    getAttachmentTypeLabel(attachment.getType()),
                    attachment.getOriginalFilename());

        } catch (IOException | RuntimeException exception) {
            writer.startPage();
            writer.writeSectionTitle("Imagem não incorporada");

            writer.writeParagraph(
                    "Não foi possível incorporar a imagem: "
                            + attachment.getOriginalFilename());

            writer.writeParagraph(
                    "Verifique se o arquivo não está corrompido.");

            writer.closeCurrentPage();
        }
    }

    private boolean isPdf(Attachment attachment) {
        if ("application/pdf".equalsIgnoreCase(attachment.getContentType())) {
            return true;
        }

        return attachment.getOriginalFilename()
                .toLowerCase(Locale.ROOT)
                .endsWith(".pdf");
    }

    private boolean isSupportedImage(Attachment attachment) {
        String contentType = attachment.getContentType();

        if ("image/png".equalsIgnoreCase(contentType)
                || "image/jpeg".equalsIgnoreCase(contentType)) {
            return true;
        }

        String filename = attachment.getOriginalFilename()
                .toLowerCase(Locale.ROOT);

        return filename.endsWith(".png")
                || filename.endsWith(".jpg")
                || filename.endsWith(".jpeg");
    }

    private int getAttachmentOrder(Attachment attachment) {
        return switch (attachment.getType()) {
            case PROOF_OF_PAYMENT -> 1;
            case INVOICE -> 2;
            case RECEIPT -> 3;
            case CONTRACT -> 4;
            case OTHER -> 5;
        };
    }

    private String getAttachmentTypeLabel(AttachmentType type) {
        return switch (type) {
            case PROOF_OF_PAYMENT -> "Comprovante de pagamento";
            case INVOICE -> "Documento fiscal";
            case RECEIPT -> "Recibo";
            case CONTRACT -> "Contrato";
            case OTHER -> "Outro documento";
        };
    }

    private String getTransactionTypeLabel(FinancialTransactionType type) {
        return switch (type) {
            case INCOME -> "Receita";
            case EXPENSE -> "Despesa";
            case TRANSFER -> "Transferência";
        };
    }

    private String getTransactionDescription(
            FinancialTransaction transaction) {

        if (transaction.getDescription() != null
                && !transaction.getDescription().isBlank()) {
            return transaction.getDescription();
        }

        if (transaction.getRawDescription() != null
                && !transaction.getRawDescription().isBlank()) {
            return transaction.getRawDescription();
        }

        return "Sem descrição";
    }

    private BigDecimal getTransactionAmount(
            FinancialTransaction transaction) {

        if (transaction.getSettledAmount() != null) {
            return transaction.getSettledAmount().abs();
        }

        return transaction.getExpectedAmount() != null
                ? transaction.getExpectedAmount().abs()
                : BigDecimal.ZERO;
    }

    private String formatCurrency(BigDecimal value) {
        return CURRENCY_FORMATTER.format(
                value != null ? value : BigDecimal.ZERO);
    }

    private String formatDate(LocalDate date) {
        return date != null ? DATE_FORMATTER.format(date) : "-";
    }

    private String formatPeriod(
            LocalDate periodStartDate,
            LocalDate periodEndDate) {

        return formatDate(periodStartDate)
                + " até "
                + formatDate(periodEndDate);
    }

    private static final class PdfWriter {

        private static final float PAGE_WIDTH = PDRectangle.A4.getWidth();
        private static final float PAGE_HEIGHT = PDRectangle.A4.getHeight();

        private static final float LEFT_MARGIN = 52f;
        private static final float RIGHT_MARGIN = 52f;
        private static final float TOP_MARGIN = 58f;
        private static final float BOTTOM_MARGIN = 52f;

        private static final float CONTENT_WIDTH = PAGE_WIDTH - LEFT_MARGIN - RIGHT_MARGIN;

        private static final Color PRIMARY_COLOR = new Color(15, 118, 110);

        private static final Color MUTED_COLOR = new Color(245, 245, 245);

        private final PDDocument document;
        private final PDFont regularFont;
        private final PDFont boldFont;

        private PDPageContentStream contentStream;
        private float cursorY;

        private PdfWriter(PDDocument document) throws IOException {
            this.document = document;
            this.regularFont = new PDType1Font(
                    Standard14Fonts.FontName.HELVETICA);
            this.boldFont = new PDType1Font(
                    Standard14Fonts.FontName.HELVETICA_BOLD);
        }

        void writeImagePage(
                byte[] imageBytes,
                String attachmentType,
                String originalFilename) throws IOException {

            PDImageXObject image = PDImageXObject.createFromByteArray(
                    document,
                    imageBytes,
                    originalFilename);

            startPage();

            writeSectionTitle(attachmentType);
            writeParagraph("Arquivo: " + originalFilename);

            float imageAreaTop = cursorY;
            float imageAreaBottom = BOTTOM_MARGIN;

            float maxWidth = CONTENT_WIDTH;
            float maxHeight = imageAreaTop - imageAreaBottom;

            float originalWidth = image.getWidth();
            float originalHeight = image.getHeight();

            if (originalWidth <= 0 || originalHeight <= 0) {
                throw new IOException("Invalid image dimensions");
            }

            float scale = Math.min(
                    maxWidth / originalWidth,
                    maxHeight / originalHeight);

            // Nunca aumenta uma imagem pequena.
            scale = Math.min(scale, 1f);

            float imageWidth = originalWidth * scale;
            float imageHeight = originalHeight * scale;

            float imageX = LEFT_MARGIN + (CONTENT_WIDTH - imageWidth) / 2f;

            float imageY = imageAreaBottom
                    + (maxHeight - imageHeight) / 2f;

            contentStream.drawImage(
                    image,
                    imageX,
                    imageY,
                    imageWidth,
                    imageHeight);

            closeCurrentPage();
        }

        void startPage() throws IOException {
            closeCurrentPage();

            PDPage page = new PDPage(PDRectangle.A4);
            document.addPage(page);

            contentStream = new PDPageContentStream(document, page);
            cursorY = PAGE_HEIGHT - TOP_MARGIN;
        }

        void startCoverPage(
                String eyebrow,
                String title,
                List<String> details) throws IOException {

            startPage();

            contentStream.setNonStrokingColor(PRIMARY_COLOR);
            contentStream.addRect(
                    0,
                    PAGE_HEIGHT - 190,
                    PAGE_WIDTH,
                    190);
            contentStream.fill();

            cursorY = PAGE_HEIGHT - 72;

            writeText(
                    eyebrow,
                    LEFT_MARGIN,
                    cursorY,
                    boldFont,
                    10,
                    Color.WHITE);

            cursorY -= 42;

            writeText(
                    title,
                    LEFT_MARGIN,
                    cursorY,
                    boldFont,
                    26,
                    Color.WHITE);

            cursorY = PAGE_HEIGHT - 250;

            for (String detail : details) {
                writeWrappedText(
                        detail,
                        regularFont,
                        11,
                        Color.DARK_GRAY,
                        16);
                cursorY -= 4;
            }

            cursorY -= 12;

            writeWrappedText(
                    "Documento gerado pelo FluxFund para conferência e prestação de contas.",
                    regularFont,
                    10,
                    Color.GRAY,
                    14);
        }

        void writeSectionTitle(String title) throws IOException {
            ensureSpace(40);

            writeText(
                    title,
                    LEFT_MARGIN,
                    cursorY,
                    boldFont,
                    18,
                    Color.DARK_GRAY);

            cursorY -= 12;

            contentStream.setStrokingColor(PRIMARY_COLOR);
            contentStream.setLineWidth(1.4f);
            contentStream.moveTo(LEFT_MARGIN, cursorY);
            contentStream.lineTo(PAGE_WIDTH - RIGHT_MARGIN, cursorY);
            contentStream.stroke();

            cursorY -= 20;
        }

        void writeMetric(
                String label,
                String value) throws IOException {

            ensureSpace(46);

            float boxHeight = 38;

            contentStream.setNonStrokingColor(MUTED_COLOR);
            contentStream.addRect(
                    LEFT_MARGIN,
                    cursorY - boxHeight + 8,
                    CONTENT_WIDTH,
                    boxHeight);
            contentStream.fill();

            writeText(
                    label,
                    LEFT_MARGIN + 12,
                    cursorY - 6,
                    regularFont,
                    9,
                    Color.GRAY);

            writeText(
                    value,
                    LEFT_MARGIN + 12,
                    cursorY - 22,
                    boldFont,
                    12,
                    Color.DARK_GRAY);

            cursorY -= 50;
        }

        void writeSmallLine(String value) throws IOException {
            ensureSpace(18);

            writeText(
                    value,
                    LEFT_MARGIN,
                    cursorY,
                    boldFont,
                    9,
                    Color.DARK_GRAY);

            cursorY -= 14;
        }

        void writeParagraph(String value) throws IOException {
            writeWrappedText(
                    value,
                    regularFont,
                    10,
                    Color.DARK_GRAY,
                    15);
            cursorY -= 6;
        }

        void writeDivider() throws IOException {
            ensureSpace(12);

            contentStream.setStrokingColor(new Color(220, 220, 220));
            contentStream.setLineWidth(0.6f);
            contentStream.moveTo(LEFT_MARGIN, cursorY);
            contentStream.lineTo(PAGE_WIDTH - RIGHT_MARGIN, cursorY);
            contentStream.stroke();

            cursorY -= 12;
        }

        private void writeWrappedText(
                String value,
                PDFont font,
                float fontSize,
                Color color,
                float lineHeight) throws IOException {

            for (String line : wrapText(value, font, fontSize)) {
                ensureSpace(lineHeight);

                writeText(
                        line,
                        LEFT_MARGIN,
                        cursorY,
                        font,
                        fontSize,
                        color);

                cursorY -= lineHeight;
            }
        }

        private List<String> wrapText(
                String value,
                PDFont font,
                float fontSize) throws IOException {

            String normalizedValue = sanitizeText(value);

            if (normalizedValue.isBlank()) {
                return List.of("-");
            }

            String[] words = normalizedValue.split("\\s+");
            var lines = new java.util.ArrayList<String>();
            StringBuilder currentLine = new StringBuilder();

            for (String word : words) {
                String candidate = currentLine.isEmpty()
                        ? word
                        : currentLine + " " + word;

                float width = font.getStringWidth(candidate)
                        / 1000f
                        * fontSize;

                if (width <= CONTENT_WIDTH) {
                    currentLine.setLength(0);
                    currentLine.append(candidate);
                    continue;
                }

                if (!currentLine.isEmpty()) {
                    lines.add(currentLine.toString());
                }

                currentLine.setLength(0);
                currentLine.append(word);
            }

            if (!currentLine.isEmpty()) {
                lines.add(currentLine.toString());
            }

            return lines;
        }

        private void ensureSpace(float requiredHeight) throws IOException {
            if (cursorY - requiredHeight >= BOTTOM_MARGIN) {
                return;
            }

            startPage();
        }

        private void writeText(
                String value,
                float x,
                float y,
                PDFont font,
                float fontSize,
                Color color) throws IOException {

            contentStream.beginText();
            contentStream.setFont(font, fontSize);
            contentStream.setNonStrokingColor(color);
            contentStream.newLineAtOffset(x, y);
            contentStream.showText(sanitizeText(value));
            contentStream.endText();
        }

        void closeCurrentPage() throws IOException {
            if (contentStream == null) {
                return;
            }

            writeFooter();

            contentStream.close();
            contentStream = null;
        }

        void close() throws IOException {
            closeCurrentPage();
        }

        private void writeFooter() throws IOException {
            contentStream.beginText();
            contentStream.setFont(regularFont, 8);
            contentStream.setNonStrokingColor(Color.GRAY);
            contentStream.newLineAtOffset(
                    LEFT_MARGIN,
                    28);
            contentStream.showText(
                    "FluxFund | Página " + document.getNumberOfPages());
            contentStream.endText();
        }

        private String sanitizeText(String value) {
            if (value == null) {
                return "-";
            }

            return Normalizer.normalize(value, Normalizer.Form.NFC)
                    .replace("\r", " ")
                    .replace("\n", " ")
                    .replace("\t", " ")
                    .replace("–", "-")
                    .replace("—", "-")
                    .replace("•", "-")
                    .replace("…", "...");
        }
    }
}
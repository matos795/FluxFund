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
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;

import org.apache.pdfbox.Loader;
import org.apache.pdfbox.multipdf.PDFMergerUtility;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.PDPageContentStream.AppendMode;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.font.PDFont;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.font.Standard14Fonts;
import org.apache.pdfbox.pdmodel.graphics.image.PDImageXObject;
import org.apache.pdfbox.pdmodel.interactive.action.PDActionGoTo;
import org.apache.pdfbox.pdmodel.interactive.annotation.PDAnnotationLink;
import org.apache.pdfbox.pdmodel.interactive.documentnavigation.destination.PDPageFitDestination;
import org.springframework.stereotype.Service;

import com.fluxfund.api.domain.attachment.Attachment;
import com.fluxfund.api.domain.attachment.AttachmentType;
import com.fluxfund.api.domain.closingdossier.ClosingDossierExtraDocumentType;
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

    private static final int TABLE_OF_CONTENTS_ENTRIES_PER_PAGE = 26;

    public byte[] generate(
            Organization organization,
            ClosingDossierPreviewRequest request,
            ClosingDossierPreviewResponse preview,
            List<ClosingDossierExportAccount> accounts,
            List<ClosingDossierExportExtraDocument> extraDocuments) {

        try (
                PDDocument document = new PDDocument();
                ByteArrayOutputStream outputStream = new ByteArrayOutputStream()) {

            PdfWriter writer = new PdfWriter(document);

            List<TableOfContentsEntry> tableOfContentsEntries = new ArrayList<>();

            writeGeneralCover(
                    writer,
                    organization,
                    request,
                    preview,
                    accounts.size(),
                    extraDocuments.size());

            int tableOfContentsEntryCount = accounts.size();

            if (!extraDocuments.isEmpty()) {
                tableOfContentsEntryCount += extraDocuments.size() + 1;
            }

            int tableOfContentsPageCount = Math.max(
                    1,
                    (int) Math.ceil(
                            (double) tableOfContentsEntryCount
                                    / TABLE_OF_CONTENTS_ENTRIES_PER_PAGE));

            List<PDPage> tableOfContentsPages = writer.reservePages(tableOfContentsPageCount);

            if (!extraDocuments.isEmpty()) {
                writeExtraDocumentsSection(
                        document,
                        writer,
                        extraDocuments,
                        tableOfContentsEntries);
            }

            for (ClosingDossierExportAccount accountData : accounts) {
                PDPage accountStartPage = writeAccountSection(
                        document,
                        writer,
                        accountData,
                        request);

                tableOfContentsEntries.add(
                        new TableOfContentsEntry(
                                accountData.account().getName(),
                                0,
                                accountStartPage));
            }

            writer.close();

            writer.writeTableOfContents(
                    tableOfContentsPages,
                    tableOfContentsEntries,
                    request);

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
            int includedAccountCount,
            int extraDocumentCount) throws IOException {

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
                        "Documentos complementares: " + extraDocumentCount,
                        "Movimentações: " + preview.totalTransactionCount(),
                        "Pendências de extrato: "
                                + preview.accountsWithoutBankStatementCount(),
                        "Pendências de comprovante: "
                                + preview.expensesWithoutPaymentProofCount(),
                        "Pendências fiscais: "
                                + preview.expensesWithoutFiscalDocumentCount()));

        writer.closeCurrentPage();
    }

    private List<FinancialTransaction> getCashTransactions(
            ClosingDossierExportAccount accountData) {

        return accountData.transactions().stream()
                .filter(transaction -> !accountData.isCreditCardStatementItem(transaction))
                .toList();
    }

    private BigDecimal sumTransactionsByType(
            List<FinancialTransaction> transactions,
            FinancialTransactionType type) {

        return transactions.stream()
                .filter(transaction -> transaction.getType() == type)
                .map(this::getTransactionAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private void writeExtraDocumentsSection(
            PDDocument document,
            PdfWriter writer,
            List<ClosingDossierExportExtraDocument> extraDocuments,
            List<TableOfContentsEntry> tableOfContentsEntries)
            throws IOException {

        PDPage sectionStartPage = writer.startPage();

        writer.writeSectionTitle("Documentos complementares");

        writer.writeParagraph(
                "Arquivos gerais vinculados ao período de fechamento. "
                        + "Eles não pertencem diretamente a uma conta ou transação.");

        writer.writeDivider();

        for (ClosingDossierExportExtraDocument documentItem : extraDocuments) {
            writer.writeSmallLine(
                    getExtraDocumentTypeLabel(documentItem.documentType()));

            writer.writeParagraph(
                    documentItem.title()
                            + " - "
                            + documentItem.originalFilename());

            writer.writeDivider();
        }

        writer.closeCurrentPage();

        tableOfContentsEntries.add(
                new TableOfContentsEntry(
                        "Documentos complementares",
                        0,
                        sectionStartPage));

        for (ClosingDossierExportExtraDocument documentItem : extraDocuments) {
            PDPage documentStartPage = appendPdfFromStorage(
                    document,
                    writer,
                    documentItem.storageKey(),
                    documentItem.originalFilename());

            tableOfContentsEntries.add(
                    new TableOfContentsEntry(
                            getExtraDocumentTypeLabel(
                                    documentItem.documentType())
                                    + " - "
                                    + documentItem.title(),
                            1,
                            documentStartPage));
        }
    }

    private String getExtraDocumentTypeLabel(
            ClosingDossierExtraDocumentType documentType) {

        return switch (documentType) {
            case ACCOUNTS_PAYABLE_REPORT -> "Relatório de contas a pagar";
            case ACCOUNTS_RECEIVABLE_REPORT -> "Relatório de contas a receber";
            case MISSIONARY_SUPPORT_REPORT -> "Relatório de sustento missionário";
            case CIELO_STATEMENT -> "Extrato Cielo";
            case INVESTMENT_STATEMENT -> "Extrato de aplicações";
            case OTHER -> "Outro documento";
        };
    }

    private PDPage writeAccountSection(
            PDDocument document,
            PdfWriter writer,
            ClosingDossierExportAccount accountData,
            ClosingDossierPreviewRequest request) throws IOException {

        var account = accountData.account();
        var preview = accountData.preview();

        List<FinancialTransaction> cashTransactions = getCashTransactions(accountData);

        BigDecimal incomeTotal = sumTransactionsByType(
                cashTransactions,
                FinancialTransactionType.INCOME);

        BigDecimal expenseTotal = sumTransactionsByType(
                cashTransactions,
                FinancialTransactionType.EXPENSE);

        BigDecimal transferTotal = sumTransactionsByType(
                cashTransactions,
                FinancialTransactionType.TRANSFER);

        long paidCreditCardStatements = cashTransactions.stream()
                .filter(transaction -> accountData.findCreditCardStatementForPayment(transaction)
                        .isPresent())
                .count();

        PDPage accountStartPage = writer.startCoverPage(
                "CONTA",
                account.getName(),
                List.of(
                        "Período: " + formatPeriod(
                                request.periodStartDate(),
                                request.periodEndDate()),
                        "Movimentações bancárias: "
                                + cashTransactions.size(),
                        "Receitas: " + formatCurrency(incomeTotal),
                        "Despesas diretas: " + formatCurrency(expenseTotal),
                        "Transferências: " + formatCurrency(transferTotal),
                        "Faturas pagas no período: "
                                + paidCreditCardStatements,
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

        writeTransactionList(writer, accountData);

        for (FinancialTransaction transaction : cashTransactions) {
            var creditCardStatement = accountData.findCreditCardStatementForPayment(transaction);

            if (creditCardStatement.isPresent()) {
                writeCreditCardStatementSection(
                        document,
                        writer,
                        transaction,
                        creditCardStatement.get());

                continue;
            }

            if (transaction.getType() == FinancialTransactionType.EXPENSE) {
                writeExpenseSection(
                        document,
                        writer,
                        transaction,
                        accountData.getAttachments(transaction));
            }
        }

        return accountStartPage;
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
            ClosingDossierExportAccount accountData) throws IOException {

        List<FinancialTransaction> transactions = getCashTransactions(accountData);

        writer.startPage();
        writer.writeSectionTitle("Lista de movimentações bancárias");

        if (transactions.isEmpty()) {
            writer.writeParagraph(
                    "Nenhuma movimentação encontrada para os filtros selecionados.");
            writer.closeCurrentPage();
            return;
        }

        for (FinancialTransaction transaction : transactions) {
            var creditCardStatement = accountData.findCreditCardStatementForPayment(transaction);

            String description = creditCardStatement
                    .map(statement -> "Pagamento da fatura: "
                            + statement.statement().getName())
                    .orElseGet(() -> getTransactionDescription(transaction));

            writer.writeSmallLine(
                    formatDate(transaction.getSettlementDate())
                            + " | "
                            + getTransactionTypeLabel(transaction.getType())
                            + " | "
                            + formatCurrency(
                                    getTransactionAmount(transaction)));

            writer.writeParagraph(description);

            if (creditCardStatement.isPresent()) {
                ClosingDossierCreditCardStatement creditCardDossier = creditCardStatement.get();

                writer.writeSmallLine(
                        "Cartão: "
                                + creditCardDossier.statement()
                                        .getCreditCardAccount()
                                        .getName()
                                + " | Itens: "
                                + creditCardDossier.items().size());
            }

            writer.writeDivider();
        }

        writer.closeCurrentPage();
    }

    private void writeCreditCardStatementSection(
            PDDocument document,
            PdfWriter writer,
            FinancialTransaction paymentTransaction,
            ClosingDossierCreditCardStatement creditCardStatement)
            throws IOException {

        var statement = creditCardStatement.statement();

        writer.startPage();
        writer.writeSectionTitle("Pagamento de fatura");

        writer.writeMetric(
                "Cartão",
                statement.getCreditCardAccount().getName());

        writer.writeMetric(
                "Fatura",
                statement.getName());

        writer.writeMetric(
                "Vencimento",
                formatDate(statement.getDueDate()));

        writer.writeMetric(
                "Data do pagamento",
                formatDate(paymentTransaction.getSettlementDate()));

        writer.writeMetric(
                "Valor pago",
                formatCurrency(getTransactionAmount(paymentTransaction)));

        writer.writeMetric(
                "Itens da fatura",
                String.valueOf(creditCardStatement.items().size()));

        boolean hasStatementPdf = statement.getStatementPdfStorageKey() != null
                && !statement.getStatementPdfStorageKey().isBlank();

        if (hasStatementPdf) {
            writer.writeParagraph(
                    "PDF oficial da fatura incluído a seguir: "
                            + statement.getStatementPdfOriginalFilename());
        } else {
            writer.writeParagraph(
                    "PDF oficial da fatura não foi enviado.");
        }

        writer.closeCurrentPage();

        if (hasStatementPdf) {
            appendPdfFromStorage(
                    document,
                    writer,
                    statement.getStatementPdfStorageKey(),
                    statement.getStatementPdfOriginalFilename());
        }

        writeCreditCardStatementItemsList(
                writer,
                creditCardStatement);

        for (FinancialTransaction item : creditCardStatement.items()) {
            writeExpenseSection(
                    document,
                    writer,
                    item,
                    creditCardStatement.getAttachments(item),
                    "Item da fatura");
        }
    }

    private void writeCreditCardStatementItemsList(
            PdfWriter writer,
            ClosingDossierCreditCardStatement creditCardStatement)
            throws IOException {

        writer.startPage();
        writer.writeSectionTitle("Itens da fatura");

        if (creditCardStatement.items().isEmpty()) {
            writer.writeParagraph(
                    "Nenhum item foi encontrado para esta fatura.");
            writer.closeCurrentPage();
            return;
        }

        int itemNumber = 1;

        for (FinancialTransaction item : creditCardStatement.items()) {
            String categoryName = item.getCategory() != null
                    ? item.getCategory().getName()
                    : "Sem categoria";

            int documentCount = creditCardStatement.getAttachments(item).size();

            writer.writeSmallLine(
                    itemNumber
                            + ". "
                            + formatCurrency(getTransactionAmount(item))
                            + " | "
                            + categoryName);

            writer.writeParagraph(getTransactionDescription(item));

            writer.writeSmallLine(
                    documentCount == 1
                            ? "1 documento vinculado"
                            : documentCount + " documentos vinculados");

            writer.writeDivider();

            itemNumber++;
        }

        writer.closeCurrentPage();
    }

    private void writeExpenseSection(
            PDDocument document,
            PdfWriter writer,
            FinancialTransaction transaction,
            List<Attachment> attachments) throws IOException {

        writeExpenseSection(
                document,
                writer,
                transaction,
                attachments,
                "Despesa");
    }

    private void writeExpenseSection(
            PDDocument document,
            PdfWriter writer,
            FinancialTransaction transaction,
            List<Attachment> attachments,
            String sectionTitle) throws IOException {

        List<Attachment> sortedAttachments = sortAttachments(attachments);

        writer.startPage();
        writer.writeSectionTitle(sectionTitle);

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
                    "Nenhum documento foi vinculado a este item.");

            writer.closeCurrentPage();
            return;
        }

        writer.writeParagraph("Documentos incluídos a seguir:");

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

    private PDPage appendPdfFromStorage(
            PDDocument destination,
            PdfWriter writer,
            String storageKey,
            String filename) throws IOException {

        writer.closeCurrentPage();

        int pageCountBeforeAppend = destination.getNumberOfPages();

        try (PDDocument source = Loader.loadPDF(storageService.read(storageKey))) {
            PDFMergerUtility merger = new PDFMergerUtility();
            merger.appendDocument(destination, source);

            if (destination.getNumberOfPages() > pageCountBeforeAppend) {
                return destination.getPage(pageCountBeforeAppend);
            }

        } catch (IOException | RuntimeException exception) {
            // O aviso será gerado abaixo.
        }

        PDPage warningPage = writer.startPage();

        writer.writeSectionTitle("Arquivo não incorporado");
        writer.writeParagraph(
                "Não foi possível incorporar o arquivo: " + filename);
        writer.writeParagraph(
                "Verifique se o PDF está disponível, não possui senha "
                        + "e não está corrompido.");

        writer.closeCurrentPage();

        return warningPage;
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

    private static String formatDate(LocalDate date) {
        return date != null ? DATE_FORMATTER.format(date) : "-";
    }

    private static String formatPeriod(
            LocalDate periodStartDate,
            LocalDate periodEndDate) {

        return formatDate(periodStartDate)
                + " até "
                + formatDate(periodEndDate);
    }

    private record TableOfContentsEntry(
            String label,
            int level,
            PDPage targetPage) {
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

        List<PDPage> reservePages(int pageCount) throws IOException {
            closeCurrentPage();

            List<PDPage> pages = new ArrayList<>();

            for (int index = 0; index < pageCount; index++) {
                PDPage page = new PDPage(PDRectangle.A4);
                document.addPage(page);
                pages.add(page);
            }

            return pages;
        }

        PDPage startPage() throws IOException {
            closeCurrentPage();

            PDPage page = new PDPage(PDRectangle.A4);
            document.addPage(page);

            contentStream = new PDPageContentStream(document, page);
            cursorY = PAGE_HEIGHT - TOP_MARGIN;

            return page;
        }

        PDPage startCoverPage(
                String eyebrow,
                String title,
                List<String> details) throws IOException {

            PDPage page = startPage();

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

            return page;
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

        void writeTableOfContents(
                List<PDPage> pages,
                List<TableOfContentsEntry> entries,
                ClosingDossierPreviewRequest request)
                throws IOException {

            int entryIndex = 0;

            for (int pageIndex = 0; pageIndex < pages.size(); pageIndex++) {
                PDPage page = pages.get(pageIndex);

                try (PDPageContentStream stream = new PDPageContentStream(
                        document,
                        page,
                        AppendMode.APPEND,
                        true,
                        true)) {

                    float y = PAGE_HEIGHT - TOP_MARGIN;

                    writeText(
                            stream,
                            pageIndex == 0
                                    ? "SUMÁRIO DO FECHAMENTO"
                                    : "SUMÁRIO DO FECHAMENTO - CONTINUAÇÃO",
                            LEFT_MARGIN,
                            y,
                            boldFont,
                            18,
                            Color.DARK_GRAY);

                    y -= 18;

                    stream.setStrokingColor(PRIMARY_COLOR);
                    stream.setLineWidth(1.4f);
                    stream.moveTo(LEFT_MARGIN, y);
                    stream.lineTo(PAGE_WIDTH - RIGHT_MARGIN, y);
                    stream.stroke();

                    y -= 26;

                    writeText(
                            stream,
                            "Período: " + formatPeriod(
                                    request.periodStartDate(),
                                    request.periodEndDate()),
                            LEFT_MARGIN,
                            y,
                            regularFont,
                            10,
                            Color.GRAY);

                    y -= 30;

                    int limit = Math.min(
                            entryIndex + TABLE_OF_CONTENTS_ENTRIES_PER_PAGE,
                            entries.size());

                    while (entryIndex < limit) {
                        TableOfContentsEntry entry = entries.get(entryIndex);

                        float indent = entry.level() == 0 ? 0 : 18;
                        float fontSize = entry.level() == 0 ? 10.5f : 9.5f;
                        PDFont font = entry.level() == 0 ? boldFont : regularFont;

                        int targetPageNumber = getPageNumber(entry.targetPage());

                        String pageNumberText = String.valueOf(targetPageNumber);
                        float pageNumberWidth = boldFont.getStringWidth(pageNumberText)
                                / 1000f
                                * 10f;

                        float availableLabelWidth = CONTENT_WIDTH - indent - pageNumberWidth - 24;

                        String label = fitText(
                                entry.label(),
                                font,
                                fontSize,
                                availableLabelWidth);

                        writeText(
                                stream,
                                label,
                                LEFT_MARGIN + indent,
                                y,
                                font,
                                fontSize,
                                Color.DARK_GRAY);

                        writeText(
                                stream,
                                pageNumberText,
                                PAGE_WIDTH - RIGHT_MARGIN - pageNumberWidth,
                                y,
                                boldFont,
                                10,
                                Color.DARK_GRAY);

                        stream.setStrokingColor(new Color(220, 220, 220));
                        stream.setLineWidth(0.5f);
                        stream.moveTo(LEFT_MARGIN + indent, y - 7);
                        stream.lineTo(PAGE_WIDTH - RIGHT_MARGIN, y - 7);
                        stream.stroke();

                        addPageLink(page, y, entry.targetPage());

                        y -= 22;
                        entryIndex++;
                    }

                    writeFooter(stream, getPageNumber(page));
                }
            }
        }

        private void addPageLink(
                PDPage sourcePage,
                float y,
                PDPage targetPage) throws IOException {

            PDAnnotationLink link = new PDAnnotationLink();

            link.setRectangle(
                    new PDRectangle(
                            LEFT_MARGIN,
                            y - 14,
                            CONTENT_WIDTH,
                            19));

            PDActionGoTo action = new PDActionGoTo();

            PDPageFitDestination destination = new PDPageFitDestination();

            destination.setPage(targetPage);

            action.setDestination(destination);
            link.setAction(action);

            sourcePage.getAnnotations().add(link);
        }

        private int getPageNumber(PDPage targetPage) {
            int pageIndex = document.getPages().indexOf(targetPage);

            if (pageIndex >= 0) {
                return pageIndex + 1;
            }

            int pageNumber = 1;

            for (PDPage page : document.getPages()) {
                if (page.getCOSObject() == targetPage.getCOSObject()) {
                    return pageNumber;
                }

                pageNumber++;
            }

            return 0;
        }

        private String fitText(
                String value,
                PDFont font,
                float fontSize,
                float maxWidth) throws IOException {

            String normalized = sanitizeText(value);

            if (font.getStringWidth(normalized) / 1000f * fontSize <= maxWidth) {
                return normalized;
            }

            String suffix = "...";
            int endIndex = normalized.length();

            while (endIndex > 0) {
                String candidate = normalized.substring(0, endIndex).trim() + suffix;

                if (font.getStringWidth(candidate) / 1000f * fontSize <= maxWidth) {
                    return candidate;
                }

                endIndex--;
            }

            return suffix;
        }

        private void writeText(
                PDPageContentStream stream,
                String value,
                float x,
                float y,
                PDFont font,
                float fontSize,
                Color color) throws IOException {

            stream.beginText();
            stream.setFont(font, fontSize);
            stream.setNonStrokingColor(color);
            stream.newLineAtOffset(x, y);
            stream.showText(sanitizeText(value));
            stream.endText();
        }

        private void writeFooter(
                PDPageContentStream stream,
                int pageNumber) throws IOException {

            stream.beginText();
            stream.setFont(regularFont, 8);
            stream.setNonStrokingColor(Color.GRAY);
            stream.newLineAtOffset(LEFT_MARGIN, 28);
            stream.showText("FluxFund | Página " + pageNumber);
            stream.endText();
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
            writeFooter(contentStream, document.getNumberOfPages());
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
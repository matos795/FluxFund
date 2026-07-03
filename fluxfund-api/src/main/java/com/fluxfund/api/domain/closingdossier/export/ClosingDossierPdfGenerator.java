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
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

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
import com.fluxfund.api.domain.report.dto.accountability.AccountabilityReportItemResponse;
import com.fluxfund.api.domain.report.dto.accountability.AccountabilityReportResponse;
import com.fluxfund.api.domain.report.dto.category.CategoryResultItemResponse;
import com.fluxfund.api.domain.report.dto.expense.SettledExpenseReportItemResponse;
import com.fluxfund.api.domain.report.dto.expense.SettledExpenseReportResponse;
import com.fluxfund.api.domain.report.dto.fund.FundMovementReportItemResponse;
import com.fluxfund.api.domain.report.dto.fund.FundMovementReportResponse;
import com.fluxfund.api.domain.report.dto.income.SettledIncomeReportItemResponse;
import com.fluxfund.api.domain.report.dto.income.SettledIncomeReportResponse;
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

        private static final Color INCOME_HIGHLIGHT_COLOR = new Color(22, 101, 52);

        public byte[] generate(
                        Organization organization,
                        ClosingDossierPreviewRequest request,
                        ClosingDossierPreviewResponse preview,
                        List<ClosingDossierExportAccount> accounts,
                        List<ClosingDossierExportExtraDocument> extraDocuments,
                        AccountabilityReportResponse supportReport,
                        SettledExpenseReportResponse settledExpenseReport,
                        SettledIncomeReportResponse settledIncomeReport,
                        FundMovementReportResponse fundMovementReport) {

                try (
                                PDDocument document = new PDDocument();
                                ByteArrayOutputStream outputStream = new ByteArrayOutputStream()) {

                        PdfWriter writer = new PdfWriter(
                                        document,
                                        buildFooterIdentity(organization));

                        List<TableOfContentsEntry> tableOfContentsEntries = new ArrayList<>();

                        writeGeneralCover(
                                        writer,
                                        organization,
                                        request,
                                        preview,
                                        accounts.size(),
                                        extraDocuments.size());

                        int tableOfContentsEntryCount = accounts.size() + 1;

                        if (supportReport != null) {
                                tableOfContentsEntryCount++;
                        }

                        if (settledExpenseReport != null) {
                                tableOfContentsEntryCount++;
                        }

                        if (settledIncomeReport != null) {
                                tableOfContentsEntryCount++;
                        }

                        if (fundMovementReport != null) {
                                tableOfContentsEntryCount++;
                        }

                        if (!extraDocuments.isEmpty()) {
                                tableOfContentsEntryCount += extraDocuments.size();
                        }

                        int tableOfContentsPageCount = Math.max(
                                        1,
                                        (int) Math.ceil(
                                                        (double) tableOfContentsEntryCount
                                                                        / TABLE_OF_CONTENTS_ENTRIES_PER_PAGE));

                        List<PDPage> tableOfContentsPages = writer.reservePages(tableOfContentsPageCount);

                        if (supportReport != null) {
                                PDPage supportReportStartPage = writeSupportReportSection(
                                                writer,
                                                supportReport);

                                tableOfContentsEntries.add(
                                                new TableOfContentsEntry(
                                                                "Relatório de Sustento Missionário",
                                                                0,
                                                                supportReportStartPage));
                        }

                        if (settledExpenseReport != null) {
                                PDPage settledExpenseReportStartPage = writeSettledExpenseReportSection(
                                                writer,
                                                settledExpenseReport);

                                tableOfContentsEntries.add(
                                                new TableOfContentsEntry(
                                                                "Relatório de Despesas Liquidadas",
                                                                0,
                                                                settledExpenseReportStartPage));
                        }

                        if (settledIncomeReport != null) {
                                PDPage settledIncomeReportStartPage = writeSettledIncomeReportSection(
                                                writer,
                                                settledIncomeReport);

                                tableOfContentsEntries.add(
                                                new TableOfContentsEntry(
                                                                "Relatório de Receitas Liquidadas",
                                                                0,
                                                                settledIncomeReportStartPage));
                        }

                        if (fundMovementReport != null) {
                                PDPage fundMovementReportStartPage = writeFundMovementReportSection(
                                                writer,
                                                fundMovementReport);

                                tableOfContentsEntries.add(
                                                new TableOfContentsEntry(
                                                                "Relatório de Movimentação por Fundos",
                                                                0,
                                                                fundMovementReportStartPage));
                        }

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

                        PDPage closingConferencePage = writeClosingConferencePage(
                                        writer,
                                        organization,
                                        request);

                        tableOfContentsEntries.add(
                                        new TableOfContentsEntry(
                                                        "Conferência do fechamento",
                                                        0,
                                                        closingConferencePage));

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

        public byte[] generateSupportReport(
                        Organization organization,
                        AccountabilityReportResponse supportReport) {

                try (
                                PDDocument document = new PDDocument();
                                ByteArrayOutputStream outputStream = new ByteArrayOutputStream()) {

                        PdfWriter writer = new PdfWriter(
                                        document,
                                        buildFooterIdentity(organization));

                        writeSupportReportSection(
                                        writer,
                                        supportReport);

                        writer.close();

                        document.save(outputStream);

                        return outputStream.toByteArray();

                } catch (IOException exception) {
                        throw new BusinessException(
                                        "Could not generate support report PDF");
                }
        }

        public byte[] generateSettledExpenseReport(
                        Organization organization,
                        SettledExpenseReportResponse expenseReport) {

                try (
                                PDDocument document = new PDDocument();
                                ByteArrayOutputStream outputStream = new ByteArrayOutputStream()) {

                        PdfWriter writer = new PdfWriter(
                                        document,
                                        buildFooterIdentity(organization));

                        writeSettledExpenseReportSection(
                                        writer,
                                        expenseReport);

                        writer.close();

                        document.save(outputStream);

                        return outputStream.toByteArray();

                } catch (IOException exception) {
                        throw new BusinessException(
                                        "Could not generate settled expense report PDF");
                }
        }

        public byte[] generateSettledIncomeReport(
                        Organization organization,
                        SettledIncomeReportResponse incomeReport) {

                try (
                                PDDocument document = new PDDocument();
                                ByteArrayOutputStream outputStream = new ByteArrayOutputStream()) {

                        PdfWriter writer = new PdfWriter(
                                        document,
                                        buildFooterIdentity(organization));

                        writeSettledIncomeReportSection(
                                        writer,
                                        incomeReport);

                        writer.close();

                        document.save(outputStream);

                        return outputStream.toByteArray();

                } catch (IOException exception) {
                        throw new BusinessException(
                                        "Could not generate settled income report PDF");
                }
        }

        private void writeGeneralCover(
                        PdfWriter writer,
                        Organization organization,
                        ClosingDossierPreviewRequest request,
                        ClosingDossierPreviewResponse preview,
                        int includedAccountCount,
                        int extraDocumentCount) throws IOException {

                List<String> details = new ArrayList<>();

                details.add("Razão social: " + getOrganizationLegalName(organization));

                if (hasText(organization.getCnpj())) {
                        details.add("CNPJ: " + formatCnpj(organization.getCnpj()));
                }

                String address = buildOrganizationAddress(organization);

                if (hasText(address)) {
                        details.add("Endereço: " + address);
                }

                details.add(
                                "Período: " + formatPeriod(
                                                request.periodStartDate(),
                                                request.periodEndDate()));

                details.add(
                                "Gerado em: "
                                                + formatDate(OffsetDateTime.now().toLocalDate()));

                details.add("Contas incluídas: " + includedAccountCount);
                details.add("Documentos complementares: " + extraDocumentCount);
                details.add("Movimentações: " + preview.totalTransactionCount());

                details.add(
                                "Pendências de extrato: "
                                                + preview.accountsWithoutBankStatementCount());

                details.add(
                                "Pendências de comprovante: "
                                                + preview.expensesWithoutPaymentProofCount());

                details.add(
                                "Pendências fiscais: "
                                                + preview.expensesWithoutFiscalDocumentCount());

                writer.startCoverPage(
                                "DOCUMENTOS DE FECHAMENTO CONTÁBIL / FISCAL",
                                "Dossiê de Fechamento",
                                details);

                writeOrganizationLogo(writer, organization);

                writer.closeCurrentPage();
        }

        private PDPage writeClosingConferencePage(
                        PdfWriter writer,
                        Organization organization,
                        ClosingDossierPreviewRequest request)
                        throws IOException {

                PDPage page = writer.startPage();

                writer.writeSectionTitle("Conferência do fechamento");

                writer.writeParagraph(
                                "Esta página registra os responsáveis pela conferência e "
                                                + "aprovação do Dossiê de Fechamento.");

                writer.writeMetric(
                                "Organização",
                                getOrganizationLegalName(organization));

                writer.writeMetric(
                                "Período conferido",
                                formatPeriod(
                                                request.periodStartDate(),
                                                request.periodEndDate()));

                writer.writeMetric(
                                "Data de geração",
                                formatDate(OffsetDateTime.now().toLocalDate()));

                writer.writeDivider();

                writer.writeParagraph(
                                "A assinatura nesta página é visual e destinada à conferência "
                                                + "interna ou à impressão do documento. Ela ainda não "
                                                + "representa uma assinatura digital certificada.");

                writer.writeSignatureColumns(
                                "Conferido por",
                                organization.getReviewerName(),
                                organization.getReviewerTitle(),
                                "Aprovado por",
                                organization.getApproverName(),
                                organization.getApproverTitle());

                writer.closeCurrentPage();

                return page;
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

        private PDPage writeSupportReportSection(
                        PdfWriter writer,
                        AccountabilityReportResponse supportReport)
                        throws IOException {

                PDPage coverPage = writer.startCoverPage(
                                "RELATÓRIO AUTOMÁTICO",
                                "Sustento Missionário",
                                List.of(
                                                "Período: " + formatPeriod(
                                                                supportReport.startDate(),
                                                                supportReport.endDate()),
                                                "Favorecidos com saldo a repassar: "
                                                                + supportReport.beneficiariesWithPendingBalance(),
                                                "Compromissos no período: "
                                                                + formatCurrency(
                                                                                supportReport.commitmentTotal()),
                                                "Ofertas destinadas: "
                                                                + formatCurrency(
                                                                                supportReport.allocatedTotal()),
                                                "Repassado no período: "
                                                                + formatCurrency(
                                                                                supportReport.transferredTotal()),
                                                "Saldo final a repassar: "
                                                                + formatCurrency(
                                                                                supportReport.pendingTotal())));

                writer.closeCurrentPage();

                writer.startPage();

                writer.writeSectionTitle("Resumo financeiro");

                writer.writeParagraph(
                                "Resumo automático dos compromissos, ofertas destinadas e "
                                                + "repasses realizados no período selecionado.");

                writer.writeMetric(
                                "Saldo anterior",
                                formatCurrency(
                                                supportReport.openingPendingTotal()));

                writer.writeMetric(
                                "Compromissos no período",
                                formatCurrency(
                                                supportReport.commitmentTotal()));

                writer.writeMetric(
                                "Ofertas destinadas",
                                formatCurrency(
                                                supportReport.allocatedTotal()));

                writer.writeMetric(
                                "A pagar no período",
                                formatCurrency(
                                                supportReport.payableTotal()));

                writer.writeMetric(
                                "Repassado no período",
                                formatCurrency(
                                                supportReport.transferredTotal()));

                writer.writeHighlightedMetric(
                                "Saldo final a repassar",
                                formatCurrency(
                                                supportReport.pendingTotal()));

                writer.closeCurrentPage();

                List<SupportBeneficiarySummary> beneficiarySummaries = buildSupportBeneficiarySummaries(
                                supportReport.items());

                writer.startPage();

                writer.writeSectionTitle("Resumo por favorecido");

                writer.writeParagraph(
                                "Consolidado dos valores a pagar, repassados e pendentes "
                                                + "para cada favorecido no período.");

                if (beneficiarySummaries.isEmpty()) {
                        writer.writeParagraph(
                                        "Nenhum favorecido foi encontrado para este período.");
                } else {
                        writer.writeSupportBeneficiarySummaryTable(
                                        beneficiarySummaries);
                }

                writer.closeCurrentPage();

                writer.startPage();

                writer.writeSectionTitle("Detalhamento por favorecido e fundo");

                writer.writeParagraph(
                                "Demonstrativo individual dos valores a pagar, repassados "
                                                + "e pendentes no período.");

                writer.writeParagraph(
                                "Valores positivos em “A repassar” representam pendências. "
                                                + "Valores negativos representam crédito ou adiantamento.");

                if (supportReport.items().isEmpty()) {
                        writer.writeParagraph(
                                        "Nenhum favorecido ou fundo foi encontrado para este período.");
                } else {
                        writer.writeSupportReportTable(supportReport.items());
                }

                writer.closeCurrentPage();

                return coverPage;
        }

        private List<CategoryParentSummary> buildCategorySummaries(
                        List<CategoryResultItemResponse> categoryItems) {

                Map<UUID, CategoryParentSummary> summariesByParent = new LinkedHashMap<>();

                for (CategoryResultItemResponse item : categoryItems) {
                        UUID parentCategoryId = item.parentCategoryId() != null
                                        ? item.parentCategoryId()
                                        : item.categoryId();

                        String parentCategoryName = item.parentCategoryName() != null
                                        ? item.parentCategoryName()
                                        : item.categoryName();

                        String childCategoryName = item.parentCategoryId() != null
                                        ? item.categoryName()
                                        : "Lançamentos diretos";

                        CategoryChildSummary childSummary = new CategoryChildSummary(
                                        childCategoryName,
                                        item.total(),
                                        item.transactionCount());

                        CategoryParentSummary newSummary = new CategoryParentSummary(
                                        parentCategoryName,
                                        item.total(),
                                        item.transactionCount(),
                                        List.of(childSummary));

                        summariesByParent.merge(
                                        parentCategoryId,
                                        newSummary,
                                        (current, added) -> {
                                                List<CategoryChildSummary> children = new ArrayList<>(
                                                                current.children());

                                                children.addAll(added.children());

                                                children.sort(
                                                                Comparator.comparing(
                                                                                CategoryChildSummary::totalAmount)
                                                                                .reversed()
                                                                                .thenComparing(
                                                                                                CategoryChildSummary::categoryName));

                                                return new CategoryParentSummary(
                                                                current.categoryName(),
                                                                current.totalAmount()
                                                                                .add(added.totalAmount()),
                                                                current.transactionCount()
                                                                                + added.transactionCount(),
                                                                children);
                                        });
                }

                return summariesByParent.values()
                                .stream()
                                .sorted(
                                                Comparator.comparing(
                                                                CategoryParentSummary::totalAmount)
                                                                .reversed()
                                                                .thenComparing(
                                                                                CategoryParentSummary::categoryName))
                                .toList();
        }

        private List<SupportBeneficiarySummary> buildSupportBeneficiarySummaries(
                        List<AccountabilityReportItemResponse> items) {

                Map<UUID, SupportBeneficiarySummary> summariesByBeneficiary = new LinkedHashMap<>();

                for (AccountabilityReportItemResponse item : items) {
                        SupportBeneficiarySummary newSummary = new SupportBeneficiarySummary(
                                        item.beneficiaryId(),
                                        item.beneficiaryName(),
                                        item.payableAmount(),
                                        item.transferredAmount(),
                                        item.pendingAmount());

                        summariesByBeneficiary.merge(
                                        item.beneficiaryId(),
                                        newSummary,
                                        (current, added) -> new SupportBeneficiarySummary(
                                                        current.beneficiaryId(),
                                                        current.beneficiaryName(),
                                                        current.payableAmount()
                                                                        .add(added.payableAmount()),
                                                        current.transferredAmount()
                                                                        .add(added.transferredAmount()),
                                                        current.pendingAmount()
                                                                        .add(added.pendingAmount())));
                }

                return new ArrayList<>(summariesByBeneficiary.values());
        }

        private PDPage writeSettledExpenseReportSection(
                        PdfWriter writer,
                        SettledExpenseReportResponse settledExpenseReport)
                        throws IOException {

                List<CategoryParentSummary> categorySummaries = buildCategorySummaries(
                                settledExpenseReport.categoryItems());

                PDPage coverPage = writer.startCoverPage(
                                "RELATÓRIO AUTOMÁTICO",
                                "Despesas Liquidadas",
                                List.of(
                                                "Período: " + formatPeriod(
                                                                settledExpenseReport.startDate(),
                                                                settledExpenseReport.endDate()),
                                                "Despesas liquidadas: "
                                                                + settledExpenseReport.transactionCount(),
                                                "Total pago no período: "
                                                                + formatCurrency(
                                                                                settledExpenseReport.totalPaidAmount()),
                                                "Categorias principais com movimentação: "
                                                                + categorySummaries.size()));

                writer.closeCurrentPage();

                writer.startPage();

                writer.writeSectionTitle("Resumo financeiro");

                writer.writeParagraph(
                                "Demonstrativo automático das despesas efetivamente "
                                                + "liquidadas no período selecionado.");

                writer.writeMetric(
                                "Quantidade de despesas",
                                String.valueOf(
                                                settledExpenseReport.transactionCount()));

                writer.writeHighlightedMetric(
                                "Total de despesas liquidadas",
                                formatCurrency(
                                                settledExpenseReport.totalPaidAmount()));

                writer.closeCurrentPage();

                writer.startPage();

                writer.writeSectionTitle("Gastos por categoria");

                writer.writeParagraph(
                                "Consolidado das despesas liquidadas por categoria principal e "
                                                + "subcategoria, ordenado do maior gasto para o menor.");

                if (categorySummaries.isEmpty()) {
                        writer.writeParagraph(
                                        "Nenhuma despesa liquidada foi encontrada para este período.");
                } else {
                        writer.writeCategoryHierarchy(
                                        categorySummaries,
                                        "Gastos por categoria (continuação)",
                                        "Despesas",
                                        "despesa(s)");
                }

                writer.closeCurrentPage();

                writer.startPage();

                writer.writeSectionTitle("Detalhamento das despesas liquidadas");

                writer.writeParagraph(
                                "Relação cronológica das despesas efetivamente pagas "
                                                + "no período selecionado.");

                if (settledExpenseReport.items().isEmpty()) {
                        writer.writeParagraph(
                                        "Nenhuma despesa liquidada foi encontrada para este período.");
                } else {
                        writer.writeSettledExpenseDetailTable(
                                        settledExpenseReport.items());
                }

                writer.closeCurrentPage();

                return coverPage;
        }

        private PDPage writeSettledIncomeReportSection(
                        PdfWriter writer,
                        SettledIncomeReportResponse settledIncomeReport)
                        throws IOException {

                List<CategoryParentSummary> categorySummaries = buildCategorySummaries(
                                settledIncomeReport.categoryItems());

                PDPage coverPage = writer.startCoverPage(
                                "RELATÓRIO AUTOMÁTICO",
                                "Receitas Liquidadas",
                                List.of(
                                                "Período: " + formatPeriod(
                                                                settledIncomeReport.startDate(),
                                                                settledIncomeReport.endDate()),
                                                "Receitas liquidadas: "
                                                                + settledIncomeReport.transactionCount(),
                                                "Total recebido no período: "
                                                                + formatCurrency(
                                                                                settledIncomeReport
                                                                                                .totalReceivedAmount()),
                                                "Categorias principais com movimentação: "
                                                                + categorySummaries.size()));

                writer.closeCurrentPage();

                writer.startPage();

                writer.writeSectionTitle("Resumo financeiro");

                writer.writeParagraph(
                                "Demonstrativo automático das receitas efetivamente "
                                                + "recebidas no período selecionado.");

                writer.writeMetric(
                                "Quantidade de recebimentos",
                                String.valueOf(
                                                settledIncomeReport.transactionCount()));

                writer.writeHighlightedMetric(
                                "Total de receitas liquidadas",
                                formatCurrency(
                                                settledIncomeReport.totalReceivedAmount()),
                                INCOME_HIGHLIGHT_COLOR);

                writer.closeCurrentPage();

                writer.startPage();

                writer.writeSectionTitle("Receitas por categoria");

                writer.writeParagraph(
                                "Consolidado das receitas liquidadas por categoria principal "
                                                + "e subcategoria, ordenado do maior recebimento para o menor.");

                if (categorySummaries.isEmpty()) {
                        writer.writeParagraph(
                                        "Nenhuma receita liquidada foi encontrada para este período.");
                } else {
                        writer.writeCategoryHierarchy(
                                        categorySummaries,
                                        "Receitas por categoria (continuação)",
                                        "Recebimentos",
                                        "recebimento(s)");
                }

                writer.closeCurrentPage();

                writer.startPage();

                writer.writeSectionTitle("Detalhamento das receitas liquidadas");

                writer.writeParagraph(
                                "Relação cronológica das receitas efetivamente recebidas "
                                                + "no período selecionado.");

                if (settledIncomeReport.items().isEmpty()) {
                        writer.writeParagraph(
                                        "Nenhuma receita liquidada foi encontrada para este período.");
                } else {
                        writer.writeSettledIncomeDetailTable(
                                        settledIncomeReport.items());
                }

                writer.closeCurrentPage();

                return coverPage;
        }

        private PDPage writeFundMovementReportSection(
                        PdfWriter writer,
                        FundMovementReportResponse fundMovementReport)
                        throws IOException {

                PDPage coverPage = writer.startCoverPage(
                                "RELATÓRIO AUTOMÁTICO",
                                "Movimentação por Fundos",
                                List.of(
                                                "Período: " + formatPeriod(
                                                                fundMovementReport.startDate(),
                                                                fundMovementReport.endDate()),
                                                "Fundos com movimentação: "
                                                                + fundMovementReport.items().size(),
                                                "Entradas destinadas: "
                                                                + formatCurrency(
                                                                                fundMovementReport
                                                                                                .incomeAllocatedTotal()),
                                                "Saídas utilizadas: "
                                                                + formatCurrency(
                                                                                fundMovementReport
                                                                                                .expenseAllocatedTotal()),
                                                "Transferências recebidas: "
                                                                + formatCurrency(
                                                                                fundMovementReport
                                                                                                .incomingTransferTotal()),
                                                "Transferências enviadas: "
                                                                + formatCurrency(
                                                                                fundMovementReport
                                                                                                .outgoingTransferTotal()),
                                                "Variação líquida do período: "
                                                                + formatCurrency(
                                                                                fundMovementReport
                                                                                                .netMovementTotal())));

                writer.closeCurrentPage();

                writer.startPage();

                writer.writeSectionTitle("Resumo financeiro");

                writer.writeParagraph(
                                "Demonstrativo automático da movimentação dos fundos no "
                                                + "período selecionado. Não representa o saldo atual "
                                                + "do fundo, apenas as entradas e saídas ocorridas "
                                                + "dentro deste período.");

                writer.writeMetric(
                                "Entradas destinadas",
                                formatCurrency(
                                                fundMovementReport.incomeAllocatedTotal()));

                writer.writeMetric(
                                "Saídas utilizadas",
                                formatCurrency(
                                                fundMovementReport.expenseAllocatedTotal()));

                writer.writeMetric(
                                "Transferências recebidas",
                                formatCurrency(
                                                fundMovementReport.incomingTransferTotal()));

                writer.writeMetric(
                                "Transferências enviadas",
                                formatCurrency(
                                                fundMovementReport.outgoingTransferTotal()));

                writer.writeHighlightedMetric(
                                "Variação líquida no período",
                                formatCurrency(
                                                fundMovementReport.netMovementTotal()));

                writer.closeCurrentPage();

                writer.startPage();

                writer.writeSectionTitle("Movimentação por fundo");

                writer.writeParagraph(
                                "Entradas e saídas destinadas a cada fundo, incluindo a "
                                                + "variação líquida de transferências internas.");

                if (fundMovementReport.items().isEmpty()) {
                        writer.writeParagraph(
                                        "Nenhum fundo com movimentação foi encontrado para este período.");
                } else {
                        writer.writeFundMovementTable(
                                        fundMovementReport.items());
                }

                writer.closeCurrentPage();

                return coverPage;
        }

        private void writeExtraDocumentsSection(
                        PDDocument document,
                        PdfWriter writer,
                        List<ClosingDossierExportExtraDocument> extraDocuments,
                        List<TableOfContentsEntry> tableOfContentsEntries)
                        throws IOException {

                for (ClosingDossierExportExtraDocument documentItem : extraDocuments) {
                        PDPage documentCoverPage = writeExtraDocumentCover(
                                        writer,
                                        documentItem);

                        tableOfContentsEntries.add(
                                        new TableOfContentsEntry(
                                                        getExtraDocumentTypeLabel(documentItem.documentType())
                                                                        + " - "
                                                                        + documentItem.title(),
                                                        0,
                                                        documentCoverPage));

                        appendPdfFromStorage(
                                        document,
                                        writer,
                                        documentItem.storageKey(),
                                        documentItem.originalFilename());
                }
        }

        private PDPage writeExtraDocumentCover(
                        PdfWriter writer,
                        ClosingDossierExportExtraDocument documentItem)
                        throws IOException {

                PDPage page = writer.startCoverPage(
                                "DOCUMENTO AUXILIAR",
                                documentItem.title(),
                                List.of(
                                                "Tipo: "
                                                                + getExtraDocumentTypeLabel(
                                                                                documentItem.documentType()),
                                                "Arquivo: " + documentItem.originalFilename()));

                writer.closeCurrentPage();

                return page;
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

        private void writeOrganizationLogo(
                        PdfWriter writer,
                        Organization organization) {

                if (!hasText(organization.getLogoStorageKey())) {
                        return;
                }

                try {
                        writer.writeCoverLogo(
                                        storageService.read(organization.getLogoStorageKey()),
                                        organization.getLogoOriginalFilename());

                } catch (IOException | RuntimeException exception) {
                        // A ausência ou falha da logo não pode impedir a geração do Dossiê.
                }
        }

        private String getOrganizationLegalName(Organization organization) {
                if (hasText(organization.getLegalName())) {
                        return organization.getLegalName().trim();
                }

                return organization.getName();
        }

        private String buildFooterIdentity(Organization organization) {
                String identity = getOrganizationLegalName(organization);

                if (!hasText(organization.getCnpj())) {
                        return identity;
                }

                return identity + " | CNPJ " + formatCnpj(organization.getCnpj());
        }

        private String buildOrganizationAddress(Organization organization) {
                List<String> parts = new ArrayList<>();

                String streetAndNumber = joinNonBlank(
                                ", ",
                                organization.getAddressLine(),
                                organization.getAddressNumber());

                if (hasText(streetAndNumber)) {
                        parts.add(streetAndNumber);
                }

                if (hasText(organization.getAddressComplement())) {
                        parts.add(organization.getAddressComplement().trim());
                }

                if (hasText(organization.getNeighborhood())) {
                        parts.add(organization.getNeighborhood().trim());
                }

                String cityAndState = joinNonBlank(
                                " - ",
                                organization.getCity(),
                                organization.getState());

                if (hasText(cityAndState)) {
                        parts.add(cityAndState);
                }

                if (hasText(organization.getZipCode())) {
                        parts.add("CEP " + formatZipCode(organization.getZipCode()));
                }

                return String.join(" | ", parts);
        }

        private String joinNonBlank(
                        String separator,
                        String... values) {

                List<String> parts = new ArrayList<>();

                for (String value : values) {
                        if (hasText(value)) {
                                parts.add(value.trim());
                        }
                }

                return String.join(separator, parts);
        }

        private boolean hasText(String value) {
                return value != null && !value.isBlank();
        }

        private String formatCnpj(String cnpj) {
                String digits = cnpj.replaceAll("\\D", "");

                if (digits.length() != 14) {
                        return cnpj;
                }

                return digits.substring(0, 2)
                                + "."
                                + digits.substring(2, 5)
                                + "."
                                + digits.substring(5, 8)
                                + "/"
                                + digits.substring(8, 12)
                                + "-"
                                + digits.substring(12, 14);
        }

        private String formatZipCode(String zipCode) {
                String digits = zipCode.replaceAll("\\D", "");

                if (digits.length() != 8) {
                        return zipCode;
                }

                return digits.substring(0, 5)
                                + "-"
                                + digits.substring(5, 8);
        }

        private static String formatCurrency(BigDecimal value) {
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

        private record SupportBeneficiarySummary(
                        UUID beneficiaryId,
                        String beneficiaryName,
                        BigDecimal payableAmount,
                        BigDecimal transferredAmount,
                        BigDecimal pendingAmount) {
        }

        private record CategoryChildSummary(
                        String categoryName,
                        BigDecimal totalAmount,
                        long transactionCount) {
        }

        private record CategoryParentSummary(
                        String categoryName,
                        BigDecimal totalAmount,
                        long transactionCount,
                        List<CategoryChildSummary> children) {
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
                private final String footerIdentity;

                private PDPageContentStream contentStream;
                private float cursorY;

                private PdfWriter(
                                PDDocument document,
                                String footerIdentity) throws IOException {
                        this.document = document;
                        this.footerIdentity = footerIdentity;
                        this.regularFont = new PDType1Font(
                                        Standard14Fonts.FontName.HELVETICA);
                        this.boldFont = new PDType1Font(
                                        Standard14Fonts.FontName.HELVETICA_BOLD);
                }

                void writeCoverLogo(
                                byte[] imageBytes,
                                String originalFilename) throws IOException {

                        if (contentStream == null) {
                                return;
                        }

                        PDImageXObject image = PDImageXObject.createFromByteArray(
                                        document,
                                        imageBytes,
                                        originalFilename);

                        float boxWidth = 118f;
                        float boxHeight = 82f;
                        float boxX = PAGE_WIDTH - RIGHT_MARGIN - boxWidth;
                        float boxY = PAGE_HEIGHT - 160f;
                        float padding = 8f;

                        contentStream.setNonStrokingColor(Color.WHITE);
                        contentStream.addRect(boxX, boxY, boxWidth, boxHeight);
                        contentStream.fill();

                        contentStream.setStrokingColor(new Color(225, 225, 225));
                        contentStream.setLineWidth(0.7f);
                        contentStream.addRect(boxX, boxY, boxWidth, boxHeight);
                        contentStream.stroke();

                        float availableWidth = boxWidth - (padding * 2);
                        float availableHeight = boxHeight - (padding * 2);

                        float originalWidth = image.getWidth();
                        float originalHeight = image.getHeight();

                        if (originalWidth <= 0 || originalHeight <= 0) {
                                return;
                        }

                        float scale = Math.min(
                                        availableWidth / originalWidth,
                                        availableHeight / originalHeight);

                        float imageWidth = originalWidth * scale;
                        float imageHeight = originalHeight * scale;

                        float imageX = boxX + (boxWidth - imageWidth) / 2f;
                        float imageY = boxY + (boxHeight - imageHeight) / 2f;

                        contentStream.drawImage(
                                        image,
                                        imageX,
                                        imageY,
                                        imageWidth,
                                        imageHeight);
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

                        List<String> titleLines = wrapText(title, boldFont, 26);

                        float titleFontSize = 26f;
                        float titleLineHeight = 30f;

                        if (titleLines.size() > 2) {
                                titleFontSize = 22f;
                                titleLineHeight = 26f;
                                titleLines = wrapText(title, boldFont, titleFontSize);
                        }

                        if (titleLines.size() > 2) {
                                titleFontSize = 18f;
                                titleLineHeight = 22f;
                                titleLines = List.of(
                                                fitText(
                                                                title,
                                                                boldFont,
                                                                titleFontSize,
                                                                CONTENT_WIDTH));
                        }

                        for (String line : titleLines) {
                                writeText(
                                                line,
                                                LEFT_MARGIN,
                                                cursorY,
                                                boldFont,
                                                titleFontSize,
                                                Color.WHITE);

                                cursorY -= titleLineHeight;
                        }

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

                void writeHighlightedMetric(
                                String label,
                                String value)
                                throws IOException {

                        writeHighlightedMetric(
                                        label,
                                        value,
                                        PRIMARY_COLOR);
                }

                void writeHighlightedMetric(
                                String label,
                                String value,
                                Color backgroundColor)
                                throws IOException {

                        ensureSpace(82);

                        float boxHeight = 68;

                        contentStream.setNonStrokingColor(backgroundColor);
                        contentStream.addRect(
                                        LEFT_MARGIN,
                                        cursorY - boxHeight + 8,
                                        CONTENT_WIDTH,
                                        boxHeight);
                        contentStream.fill();

                        writeText(
                                        label,
                                        LEFT_MARGIN + 12,
                                        cursorY - 8,
                                        regularFont,
                                        10,
                                        Color.WHITE);

                        writeText(
                                        value,
                                        LEFT_MARGIN + 12,
                                        cursorY - 40,
                                        boldFont,
                                        20,
                                        Color.WHITE);

                        cursorY -= 80;
                }

                void writeCategoryHierarchy(
                                List<CategoryParentSummary> summaries,
                                String continuationTitle,
                                String countColumnLabel,
                                String itemCountLabel)
                                throws IOException {

                        for (CategoryParentSummary summary : summaries) {
                                if (cursorY - 82 < BOTTOM_MARGIN) {
                                        startPage();

                                        writeSectionTitle(continuationTitle);
                                }

                                writeCategoryParentHeader(
                                                summary,
                                                itemCountLabel);
                                writeCategoryChildTableHeader(
                                                countColumnLabel);

                                for (CategoryChildSummary child : summary.children()) {
                                        if (cursorY - 40 < BOTTOM_MARGIN) {
                                                startPage();

                                                writeSectionTitle(continuationTitle);

                                                writeCategoryParentHeader(
                                                                summary,
                                                                itemCountLabel);

                                                writeCategoryChildTableHeader(
                                                                countColumnLabel);
                                        }

                                        writeCategoryChildTableRow(child);
                                }
                        }
                }

                private void writeCategoryParentHeader(
                                CategoryParentSummary summary,
                                String itemCountLabel)
                                throws IOException {

                        ensureSpace(44);

                        float boxHeight = 36f;

                        contentStream.setNonStrokingColor(new Color(239, 246, 255));
                        contentStream.addRect(
                                        LEFT_MARGIN,
                                        cursorY - boxHeight + 6,
                                        CONTENT_WIDTH,
                                        boxHeight);
                        contentStream.fill();

                        contentStream.setStrokingColor(new Color(191, 219, 254));
                        contentStream.setLineWidth(0.5f);
                        contentStream.addRect(
                                        LEFT_MARGIN,
                                        cursorY - boxHeight + 6,
                                        CONTENT_WIDTH,
                                        boxHeight);
                        contentStream.stroke();

                        writeText(
                                        fitText(
                                                        summary.categoryName(),
                                                        boldFont,
                                                        10f,
                                                        290f),
                                        LEFT_MARGIN + 10,
                                        cursorY - 11,
                                        boldFont,
                                        10f,
                                        Color.DARK_GRAY);

                        writeText(
                                        summary.transactionCount() + " " + itemCountLabel,
                                        LEFT_MARGIN + 10,
                                        cursorY - 25,
                                        regularFont,
                                        8f,
                                        new Color(75, 85, 99));

                        writeRightAlignedText(
                                        formatCurrency(summary.totalAmount()),
                                        PAGE_WIDTH - RIGHT_MARGIN - 10,
                                        cursorY - 17,
                                        10f,
                                        150f,
                                        new Color(30, 64, 175));

                        cursorY -= 42;
                }

                private void writeCategoryChildTableHeader(
                                String countColumnLabel)
                                throws IOException {

                        ensureSpace(34);

                        float headerHeight = 24f;

                        float categoryWidth = 300f;
                        float transactionCountWidth = 105f;

                        float categoryX = LEFT_MARGIN;
                        float transactionCountX = categoryX + categoryWidth;
                        float totalX = transactionCountX + transactionCountWidth;

                        float totalWidth = PAGE_WIDTH - RIGHT_MARGIN - totalX;

                        contentStream.setNonStrokingColor(PRIMARY_COLOR);
                        contentStream.addRect(
                                        LEFT_MARGIN,
                                        cursorY - headerHeight + 6,
                                        CONTENT_WIDTH,
                                        headerHeight);
                        contentStream.fill();

                        float textY = cursorY - 10;

                        writeText(
                                        "Subcategoria",
                                        categoryX + 8,
                                        textY,
                                        boldFont,
                                        8.5f,
                                        Color.WHITE);

                        writeRightAlignedText(
                                        countColumnLabel,
                                        transactionCountX + transactionCountWidth - 8,
                                        textY,
                                        8.5f,
                                        transactionCountWidth - 16,
                                        Color.WHITE);

                        writeRightAlignedText(
                                        "Total pago",
                                        totalX + totalWidth - 8,
                                        textY,
                                        8.5f,
                                        totalWidth - 16,
                                        Color.WHITE);

                        cursorY -= 30;
                }

                private void writeCategoryChildTableRow(
                                CategoryChildSummary summary)
                                throws IOException {

                        float rowHeight = 34f;

                        float categoryWidth = 300f;
                        float transactionCountWidth = 105f;

                        float categoryX = LEFT_MARGIN;
                        float transactionCountX = categoryX + categoryWidth;
                        float totalX = transactionCountX + transactionCountWidth;
                        float totalWidth = PAGE_WIDTH - RIGHT_MARGIN - totalX;

                        contentStream.setNonStrokingColor(Color.WHITE);
                        contentStream.addRect(
                                        LEFT_MARGIN,
                                        cursorY - rowHeight + 6,
                                        CONTENT_WIDTH,
                                        rowHeight);
                        contentStream.fill();

                        contentStream.setStrokingColor(new Color(225, 225, 225));
                        contentStream.setLineWidth(0.5f);
                        contentStream.addRect(
                                        LEFT_MARGIN,
                                        cursorY - rowHeight + 6,
                                        CONTENT_WIDTH,
                                        rowHeight);
                        contentStream.stroke();

                        float textY = cursorY - 14;

                        writeText(
                                        fitText(
                                                        summary.categoryName(),
                                                        regularFont,
                                                        8.5f,
                                                        categoryWidth - 26),
                                        categoryX + 18,
                                        textY,
                                        regularFont,
                                        8.5f,
                                        Color.DARK_GRAY);

                        writeRightAlignedText(
                                        String.valueOf(summary.transactionCount()),
                                        transactionCountX + transactionCountWidth - 8,
                                        textY,
                                        8.5f,
                                        transactionCountWidth - 16,
                                        Color.DARK_GRAY);

                        writeRightAlignedText(
                                        formatCurrency(summary.totalAmount()),
                                        totalX + totalWidth - 8,
                                        textY,
                                        8.5f,
                                        totalWidth - 16,
                                        Color.DARK_GRAY);

                        cursorY -= 40;
                }

                void writeSettledExpenseDetailTable(
                                List<SettledExpenseReportItemResponse> items)
                                throws IOException {

                        writeSettledExpenseDetailTableHeader();

                        for (SettledExpenseReportItemResponse item : items) {
                                float rowHeight = getSettledExpenseDetailRowHeight(item);

                                if (cursorY - rowHeight < BOTTOM_MARGIN) {
                                        startPage();

                                        writeSectionTitle(
                                                        "Detalhamento das despesas liquidadas (continuação)");

                                        writeSettledExpenseDetailTableHeader();
                                }

                                writeSettledExpenseDetailTableRow(item, rowHeight);
                        }
                }

                private void writeSettledExpenseDetailTableHeader()
                                throws IOException {

                        ensureSpace(34);

                        float headerHeight = 24f;

                        float dateWidth = 54f;
                        float descriptionWidth = 175f;
                        float categoryWidth = 103f;
                        float accountWidth = 82f;

                        float dateX = LEFT_MARGIN;
                        float descriptionX = dateX + dateWidth;
                        float categoryX = descriptionX + descriptionWidth;
                        float accountX = categoryX + categoryWidth;
                        float amountX = accountX + accountWidth;

                        contentStream.setNonStrokingColor(PRIMARY_COLOR);
                        contentStream.addRect(
                                        LEFT_MARGIN,
                                        cursorY - headerHeight + 6,
                                        CONTENT_WIDTH,
                                        headerHeight);
                        contentStream.fill();

                        float textY = cursorY - 10;

                        writeText(
                                        "Data",
                                        dateX + 7,
                                        textY,
                                        boldFont,
                                        8f,
                                        Color.WHITE);

                        writeText(
                                        "Descrição",
                                        descriptionX + 7,
                                        textY,
                                        boldFont,
                                        8f,
                                        Color.WHITE);

                        writeText(
                                        "Categoria",
                                        categoryX + 7,
                                        textY,
                                        boldFont,
                                        8f,
                                        Color.WHITE);

                        writeText(
                                        "Conta",
                                        accountX + 7,
                                        textY,
                                        boldFont,
                                        8f,
                                        Color.WHITE);

                        writeText(
                                        "Valor",
                                        amountX + 7,
                                        textY,
                                        boldFont,
                                        8f,
                                        Color.WHITE);

                        cursorY -= 30;
                }

                private float getSettledExpenseDetailRowHeight(
                                SettledExpenseReportItemResponse item)
                                throws IOException {

                        float descriptionWidth = 175f;

                        List<String> descriptionLines = getMovementDescriptionLines(
                                        item.description(),
                                        descriptionWidth - 14);

                        return descriptionLines.size() > 1 ? 46f : 34f;
                }

                private void writeSettledExpenseDetailTableRow(
                                SettledExpenseReportItemResponse item,
                                float rowHeight)
                                throws IOException {

                        float dateWidth = 54f;
                        float descriptionWidth = 175f;
                        float categoryWidth = 103f;
                        float accountWidth = 82f;

                        float dateX = LEFT_MARGIN;
                        float descriptionX = dateX + dateWidth;
                        float categoryX = descriptionX + descriptionWidth;
                        float accountX = categoryX + categoryWidth;
                        float amountX = accountX + accountWidth;
                        float amountWidth = PAGE_WIDTH - RIGHT_MARGIN - amountX;

                        List<String> descriptionLines = getMovementDescriptionLines(
                                        item.description(),
                                        descriptionWidth - 14);

                        contentStream.setNonStrokingColor(Color.WHITE);
                        contentStream.addRect(
                                        LEFT_MARGIN,
                                        cursorY - rowHeight + 6,
                                        CONTENT_WIDTH,
                                        rowHeight);
                        contentStream.fill();

                        contentStream.setStrokingColor(new Color(225, 225, 225));
                        contentStream.setLineWidth(0.5f);
                        contentStream.addRect(
                                        LEFT_MARGIN,
                                        cursorY - rowHeight + 6,
                                        CONTENT_WIDTH,
                                        rowHeight);
                        contentStream.stroke();

                        float firstLineY = cursorY - 14;

                        writeText(
                                        formatDate(item.settlementDate()),
                                        dateX + 7,
                                        firstLineY,
                                        regularFont,
                                        8f,
                                        Color.DARK_GRAY);

                        for (int index = 0; index < descriptionLines.size(); index++) {
                                writeText(
                                                descriptionLines.get(index),
                                                descriptionX + 7,
                                                firstLineY - (index * 12),
                                                regularFont,
                                                8f,
                                                Color.DARK_GRAY);
                        }

                        writeText(
                                        fitText(
                                                        item.categoryName(),
                                                        regularFont,
                                                        8f,
                                                        categoryWidth - 14),
                                        categoryX + 7,
                                        firstLineY,
                                        regularFont,
                                        8f,
                                        Color.DARK_GRAY);

                        writeText(
                                        fitText(
                                                        item.accountName(),
                                                        regularFont,
                                                        8f,
                                                        accountWidth - 14),
                                        accountX + 7,
                                        firstLineY,
                                        regularFont,
                                        8f,
                                        Color.DARK_GRAY);

                        writeRightAlignedText(
                                        formatCurrency(item.amount()),
                                        amountX + amountWidth - 7,
                                        firstLineY,
                                        8f,
                                        amountWidth - 14,
                                        Color.DARK_GRAY);

                        cursorY -= rowHeight + 6;
                }

                void writeSettledIncomeDetailTable(
                                List<SettledIncomeReportItemResponse> items)
                                throws IOException {

                        writeSettledIncomeDetailTableHeader();

                        for (SettledIncomeReportItemResponse item : items) {
                                float rowHeight = getSettledIncomeDetailRowHeight(item);

                                if (cursorY - rowHeight < BOTTOM_MARGIN) {
                                        startPage();

                                        writeSectionTitle(
                                                        "Detalhamento das receitas liquidadas (continuação)");

                                        writeSettledIncomeDetailTableHeader();
                                }

                                writeSettledIncomeDetailTableRow(item, rowHeight);
                        }
                }

                private void writeSettledIncomeDetailTableHeader()
                                throws IOException {

                        ensureSpace(34);

                        float headerHeight = 24f;

                        float dateWidth = 54f;
                        float descriptionWidth = 175f;
                        float categoryWidth = 103f;
                        float accountWidth = 82f;

                        float dateX = LEFT_MARGIN;
                        float descriptionX = dateX + dateWidth;
                        float categoryX = descriptionX + descriptionWidth;
                        float accountX = categoryX + categoryWidth;
                        float amountX = accountX + accountWidth;

                        contentStream.setNonStrokingColor(PRIMARY_COLOR);
                        contentStream.addRect(
                                        LEFT_MARGIN,
                                        cursorY - headerHeight + 6,
                                        CONTENT_WIDTH,
                                        headerHeight);
                        contentStream.fill();

                        float textY = cursorY - 10;

                        writeText(
                                        "Data",
                                        dateX + 7,
                                        textY,
                                        boldFont,
                                        8f,
                                        Color.WHITE);

                        writeText(
                                        "Descrição",
                                        descriptionX + 7,
                                        textY,
                                        boldFont,
                                        8f,
                                        Color.WHITE);

                        writeText(
                                        "Categoria",
                                        categoryX + 7,
                                        textY,
                                        boldFont,
                                        8f,
                                        Color.WHITE);

                        writeText(
                                        "Conta",
                                        accountX + 7,
                                        textY,
                                        boldFont,
                                        8f,
                                        Color.WHITE);

                        writeText(
                                        "Valor recebido",
                                        amountX + 7,
                                        textY,
                                        boldFont,
                                        8f,
                                        Color.WHITE);

                        cursorY -= 30;
                }

                private float getSettledIncomeDetailRowHeight(
                                SettledIncomeReportItemResponse item)
                                throws IOException {

                        List<String> descriptionLines = getMovementDescriptionLines(
                                        item.description(),
                                        161f);

                        return descriptionLines.size() > 1 ? 46f : 34f;
                }

                private void writeSettledIncomeDetailTableRow(
                                SettledIncomeReportItemResponse item,
                                float rowHeight)
                                throws IOException {

                        float dateWidth = 54f;
                        float descriptionWidth = 175f;
                        float categoryWidth = 103f;
                        float accountWidth = 82f;

                        float dateX = LEFT_MARGIN;
                        float descriptionX = dateX + dateWidth;
                        float categoryX = descriptionX + descriptionWidth;
                        float accountX = categoryX + categoryWidth;
                        float amountX = accountX + accountWidth;
                        float amountWidth = PAGE_WIDTH - RIGHT_MARGIN - amountX;

                        List<String> descriptionLines = getMovementDescriptionLines(
                                        item.description(),
                                        descriptionWidth - 14);

                        contentStream.setNonStrokingColor(Color.WHITE);
                        contentStream.addRect(
                                        LEFT_MARGIN,
                                        cursorY - rowHeight + 6,
                                        CONTENT_WIDTH,
                                        rowHeight);
                        contentStream.fill();

                        contentStream.setStrokingColor(new Color(225, 225, 225));
                        contentStream.setLineWidth(0.5f);
                        contentStream.addRect(
                                        LEFT_MARGIN,
                                        cursorY - rowHeight + 6,
                                        CONTENT_WIDTH,
                                        rowHeight);
                        contentStream.stroke();

                        float firstLineY = cursorY - 14;

                        writeText(
                                        formatDate(item.settlementDate()),
                                        dateX + 7,
                                        firstLineY,
                                        regularFont,
                                        8f,
                                        Color.DARK_GRAY);

                        for (int index = 0; index < descriptionLines.size(); index++) {
                                writeText(
                                                descriptionLines.get(index),
                                                descriptionX + 7,
                                                firstLineY - (index * 12),
                                                regularFont,
                                                8f,
                                                Color.DARK_GRAY);
                        }

                        writeText(
                                        fitText(
                                                        item.categoryName(),
                                                        regularFont,
                                                        8f,
                                                        categoryWidth - 14),
                                        categoryX + 7,
                                        firstLineY,
                                        regularFont,
                                        8f,
                                        Color.DARK_GRAY);

                        writeText(
                                        fitText(
                                                        item.accountName(),
                                                        regularFont,
                                                        8f,
                                                        accountWidth - 14),
                                        accountX + 7,
                                        firstLineY,
                                        regularFont,
                                        8f,
                                        Color.DARK_GRAY);

                        writeRightAlignedText(
                                        formatCurrency(item.amount()),
                                        amountX + amountWidth - 7,
                                        firstLineY,
                                        8f,
                                        amountWidth - 14,
                                        new Color(22, 101, 52));

                        cursorY -= rowHeight + 6;
                }

                void writeFundMovementTable(
                                List<FundMovementReportItemResponse> items)
                                throws IOException {

                        writeFundMovementTableHeader();

                        for (FundMovementReportItemResponse item : items) {
                                if (cursorY - 40 < BOTTOM_MARGIN) {
                                        startPage();

                                        writeSectionTitle(
                                                        "Movimentação por fundo (continuação)");

                                        writeFundMovementTableHeader();
                                }

                                writeFundMovementTableRow(item);
                        }
                }

                private void writeFundMovementTableHeader()
                                throws IOException {

                        ensureSpace(34);

                        float headerHeight = 24f;

                        float fundWidth = 155f;
                        float incomeWidth = 82f;
                        float expenseWidth = 82f;
                        float transferWidth = 96f;

                        float fundX = LEFT_MARGIN;
                        float incomeX = fundX + fundWidth;
                        float expenseX = incomeX + incomeWidth;
                        float transferX = expenseX + expenseWidth;
                        float variationX = transferX + transferWidth;
                        float variationWidth = PAGE_WIDTH - RIGHT_MARGIN - variationX;

                        contentStream.setNonStrokingColor(PRIMARY_COLOR);
                        contentStream.addRect(
                                        LEFT_MARGIN,
                                        cursorY - headerHeight + 6,
                                        CONTENT_WIDTH,
                                        headerHeight);
                        contentStream.fill();

                        float textY = cursorY - 10;

                        writeText(
                                        "Fundo",
                                        fundX + 8,
                                        textY,
                                        boldFont,
                                        8f,
                                        Color.WHITE);

                        writeRightAlignedText(
                                        "Entradas",
                                        incomeX + incomeWidth - 8,
                                        textY,
                                        8f,
                                        incomeWidth - 16,
                                        Color.WHITE);

                        writeRightAlignedText(
                                        "Saídas",
                                        expenseX + expenseWidth - 8,
                                        textY,
                                        8f,
                                        expenseWidth - 16,
                                        Color.WHITE);

                        writeRightAlignedText(
                                        "Transf. líquida",
                                        transferX + transferWidth - 8,
                                        textY,
                                        8f,
                                        transferWidth - 16,
                                        Color.WHITE);

                        writeRightAlignedText(
                                        "Variação",
                                        variationX + variationWidth - 8,
                                        textY,
                                        8f,
                                        variationWidth - 16,
                                        Color.WHITE);

                        cursorY -= 30;
                }

                private void writeFundMovementTableRow(
                                FundMovementReportItemResponse item)
                                throws IOException {

                        float rowHeight = 34f;

                        float fundWidth = 155f;
                        float incomeWidth = 82f;
                        float expenseWidth = 82f;
                        float transferWidth = 96f;

                        float fundX = LEFT_MARGIN;
                        float incomeX = fundX + fundWidth;
                        float expenseX = incomeX + incomeWidth;
                        float transferX = expenseX + expenseWidth;
                        float variationX = transferX + transferWidth;
                        float variationWidth = PAGE_WIDTH - RIGHT_MARGIN - variationX;

                        BigDecimal netMovementAmount = item.netMovementAmount();

                        Color backgroundColor = Color.WHITE;
                        Color variationColor = Color.DARK_GRAY;

                        if (netMovementAmount.compareTo(BigDecimal.ZERO) > 0) {
                                backgroundColor = new Color(240, 253, 244);
                                variationColor = new Color(22, 101, 52);
                        }

                        if (netMovementAmount.compareTo(BigDecimal.ZERO) < 0) {
                                backgroundColor = new Color(254, 242, 242);
                                variationColor = new Color(185, 28, 28);
                        }

                        contentStream.setNonStrokingColor(backgroundColor);
                        contentStream.addRect(
                                        LEFT_MARGIN,
                                        cursorY - rowHeight + 6,
                                        CONTENT_WIDTH,
                                        rowHeight);
                        contentStream.fill();

                        contentStream.setStrokingColor(new Color(225, 225, 225));
                        contentStream.setLineWidth(0.5f);
                        contentStream.addRect(
                                        LEFT_MARGIN,
                                        cursorY - rowHeight + 6,
                                        CONTENT_WIDTH,
                                        rowHeight);
                        contentStream.stroke();

                        float textY = cursorY - 14;

                        writeText(
                                        fitText(
                                                        item.fundName(),
                                                        regularFont,
                                                        8.5f,
                                                        fundWidth - 14),
                                        fundX + 8,
                                        textY,
                                        regularFont,
                                        8.5f,
                                        Color.DARK_GRAY);

                        writeRightAlignedText(
                                        formatCurrency(item.incomeAllocatedAmount()),
                                        incomeX + incomeWidth - 8,
                                        textY,
                                        8.5f,
                                        incomeWidth - 16,
                                        Color.DARK_GRAY);

                        writeRightAlignedText(
                                        formatCurrency(item.expenseAllocatedAmount()),
                                        expenseX + expenseWidth - 8,
                                        textY,
                                        8.5f,
                                        expenseWidth - 16,
                                        Color.DARK_GRAY);

                        Color transferColor = Color.DARK_GRAY;

                        if (item.netTransferAmount().compareTo(BigDecimal.ZERO) > 0) {
                                transferColor = new Color(22, 101, 52);
                        }

                        if (item.netTransferAmount().compareTo(BigDecimal.ZERO) < 0) {
                                transferColor = new Color(185, 28, 28);
                        }

                        writeRightAlignedText(
                                        formatCurrency(item.netTransferAmount()),
                                        transferX + transferWidth - 8,
                                        textY,
                                        8.5f,
                                        transferWidth - 16,
                                        transferColor);

                        writeRightAlignedText(
                                        formatCurrency(item.netMovementAmount()),
                                        variationX + variationWidth - 8,
                                        textY,
                                        8.5f,
                                        variationWidth - 16,
                                        variationColor);

                        cursorY -= 40;
                }

                void writeSupportBeneficiarySummaryTable(
                                List<SupportBeneficiarySummary> summaries)
                                throws IOException {

                        writeSupportBeneficiarySummaryTableHeader();

                        for (SupportBeneficiarySummary summary : summaries) {
                                if (cursorY - 40 < BOTTOM_MARGIN) {
                                        startPage();

                                        writeSectionTitle(
                                                        "Resumo por favorecido (continuação)");

                                        writeSupportBeneficiarySummaryTableHeader();
                                }

                                writeSupportBeneficiarySummaryTableRow(summary);
                        }
                }

                private List<String> getMovementDescriptionLines(
                                String description,
                                float maxWidth)
                                throws IOException {

                        String resolvedDescription = description != null
                                        && !description.isBlank()
                                                        ? description
                                                        : "Sem descrição";

                        List<String> lines = wrapText(
                                        resolvedDescription,
                                        regularFont,
                                        8f,
                                        maxWidth);

                        if (lines.size() <= 2) {
                                return lines;
                        }

                        return List.of(
                                        lines.get(0),
                                        fitText(
                                                        lines.get(1) + " ...",
                                                        regularFont,
                                                        8f,
                                                        maxWidth));
                }

                private void writeSupportBeneficiarySummaryTableHeader()
                                throws IOException {

                        ensureSpace(34);

                        float headerHeight = 24f;

                        float beneficiaryWidth = 204f;
                        float payableWidth = 96f;
                        float transferredWidth = 102f;

                        float beneficiaryX = LEFT_MARGIN;
                        float payableX = beneficiaryX + beneficiaryWidth;
                        float transferredX = payableX + payableWidth;
                        float pendingX = transferredX + transferredWidth;

                        contentStream.setNonStrokingColor(PRIMARY_COLOR);
                        contentStream.addRect(
                                        LEFT_MARGIN,
                                        cursorY - headerHeight + 6,
                                        CONTENT_WIDTH,
                                        headerHeight);
                        contentStream.fill();

                        float textY = cursorY - 10;

                        writeText(
                                        "Favorecido",
                                        beneficiaryX + 8,
                                        textY,
                                        boldFont,
                                        8.5f,
                                        Color.WHITE);

                        writeText(
                                        "A pagar",
                                        payableX + 8,
                                        textY,
                                        boldFont,
                                        8.5f,
                                        Color.WHITE);

                        writeText(
                                        "Repassado",
                                        transferredX + 8,
                                        textY,
                                        boldFont,
                                        8.5f,
                                        Color.WHITE);

                        writeText(
                                        "A repassar",
                                        pendingX + 8,
                                        textY,
                                        boldFont,
                                        8.5f,
                                        Color.WHITE);

                        cursorY -= 30;
                }

                private void writeSupportBeneficiarySummaryTableRow(
                                SupportBeneficiarySummary summary)
                                throws IOException {

                        float rowHeight = 34f;

                        float beneficiaryWidth = 204f;
                        float payableWidth = 96f;
                        float transferredWidth = 102f;

                        float beneficiaryX = LEFT_MARGIN;
                        float payableX = beneficiaryX + beneficiaryWidth;
                        float transferredX = payableX + payableWidth;
                        float pendingX = transferredX + transferredWidth;

                        float pendingWidth = PAGE_WIDTH - RIGHT_MARGIN - pendingX;

                        BigDecimal pendingAmount = summary.pendingAmount();

                        Color backgroundColor = Color.WHITE;
                        Color pendingTextColor = Color.DARK_GRAY;

                        if (pendingAmount.compareTo(BigDecimal.ZERO) > 0) {
                                backgroundColor = new Color(255, 251, 235);
                                pendingTextColor = new Color(146, 64, 14);
                        }

                        if (pendingAmount.compareTo(BigDecimal.ZERO) < 0) {
                                backgroundColor = new Color(240, 253, 244);
                                pendingTextColor = new Color(22, 101, 52);
                        }

                        contentStream.setNonStrokingColor(backgroundColor);
                        contentStream.addRect(
                                        LEFT_MARGIN,
                                        cursorY - rowHeight + 6,
                                        CONTENT_WIDTH,
                                        rowHeight);
                        contentStream.fill();

                        contentStream.setStrokingColor(new Color(225, 225, 225));
                        contentStream.setLineWidth(0.5f);
                        contentStream.addRect(
                                        LEFT_MARGIN,
                                        cursorY - rowHeight + 6,
                                        CONTENT_WIDTH,
                                        rowHeight);
                        contentStream.stroke();

                        float textY = cursorY - 14;

                        writeText(
                                        fitText(
                                                        summary.beneficiaryName(),
                                                        regularFont,
                                                        8.5f,
                                                        beneficiaryWidth - 14),
                                        beneficiaryX + 8,
                                        textY,
                                        regularFont,
                                        8.5f,
                                        Color.DARK_GRAY);

                        writeRightAlignedText(
                                        formatCurrency(summary.payableAmount()),
                                        payableX + payableWidth - 8,
                                        textY,
                                        8.5f,
                                        payableWidth - 12,
                                        Color.DARK_GRAY);

                        writeRightAlignedText(
                                        formatCurrency(summary.transferredAmount()),
                                        transferredX + transferredWidth - 8,
                                        textY,
                                        8.5f,
                                        transferredWidth - 12,
                                        Color.DARK_GRAY);

                        writeRightAlignedText(
                                        formatCurrency(summary.pendingAmount()),
                                        pendingX + pendingWidth - 8,
                                        textY,
                                        8.5f,
                                        pendingWidth - 16,
                                        pendingTextColor);

                        cursorY -= 40;
                }

                void writeSupportReportTable(
                                List<AccountabilityReportItemResponse> items)
                                throws IOException {

                        writeSupportReportTableHeader();

                        for (AccountabilityReportItemResponse item : items) {
                                if (cursorY - 40 < BOTTOM_MARGIN) {
                                        startPage();

                                        writeSectionTitle(
                                                        "Detalhamento por favorecido e fundo (continuação)");

                                        writeSupportReportTableHeader();
                                }

                                writeSupportReportTableRow(item);
                        }
                }

                private void writeSupportReportTableHeader() throws IOException {
                        ensureSpace(34);

                        float headerHeight = 24f;

                        float beneficiaryWidth = 132f;
                        float fundWidth = 86f;
                        float payableWidth = 82f;
                        float transferredWidth = 90f;

                        float beneficiaryX = LEFT_MARGIN;
                        float fundX = beneficiaryX + beneficiaryWidth;
                        float payableX = fundX + fundWidth;
                        float transferredX = payableX + payableWidth;
                        float pendingX = transferredX + transferredWidth;

                        contentStream.setNonStrokingColor(PRIMARY_COLOR);
                        contentStream.addRect(
                                        LEFT_MARGIN,
                                        cursorY - headerHeight + 6,
                                        CONTENT_WIDTH,
                                        headerHeight);
                        contentStream.fill();

                        float textY = cursorY - 10;

                        writeText(
                                        "Favorecido",
                                        beneficiaryX + 8,
                                        textY,
                                        boldFont,
                                        8.5f,
                                        Color.WHITE);

                        writeText(
                                        "Fundo",
                                        fundX + 8,
                                        textY,
                                        boldFont,
                                        8.5f,
                                        Color.WHITE);

                        writeText(
                                        "A pagar",
                                        payableX + 8,
                                        textY,
                                        boldFont,
                                        8.5f,
                                        Color.WHITE);

                        writeText(
                                        "Repassado",
                                        transferredX + 8,
                                        textY,
                                        boldFont,
                                        8.5f,
                                        Color.WHITE);

                        writeText(
                                        "A repassar",
                                        pendingX + 8,
                                        textY,
                                        boldFont,
                                        8.5f,
                                        Color.WHITE);

                        cursorY -= 30;
                }

                private void writeSupportReportTableRow(
                                AccountabilityReportItemResponse item)
                                throws IOException {

                        float rowHeight = 34f;

                        float beneficiaryWidth = 132f;
                        float fundWidth = 86f;
                        float payableWidth = 82f;
                        float transferredWidth = 90f;

                        float beneficiaryX = LEFT_MARGIN;
                        float fundX = beneficiaryX + beneficiaryWidth;
                        float payableX = fundX + fundWidth;
                        float transferredX = payableX + payableWidth;
                        float pendingX = transferredX + transferredWidth;

                        float pendingWidth = PAGE_WIDTH - RIGHT_MARGIN - pendingX;

                        BigDecimal pendingAmount = item.pendingAmount();

                        Color backgroundColor = Color.WHITE;
                        Color pendingTextColor = Color.DARK_GRAY;

                        if (pendingAmount.compareTo(BigDecimal.ZERO) > 0) {
                                backgroundColor = new Color(255, 251, 235);
                                pendingTextColor = new Color(146, 64, 14);
                        }

                        if (pendingAmount.compareTo(BigDecimal.ZERO) < 0) {
                                backgroundColor = new Color(240, 253, 244);
                                pendingTextColor = new Color(22, 101, 52);
                        }

                        contentStream.setNonStrokingColor(backgroundColor);
                        contentStream.addRect(
                                        LEFT_MARGIN,
                                        cursorY - rowHeight + 6,
                                        CONTENT_WIDTH,
                                        rowHeight);
                        contentStream.fill();

                        contentStream.setStrokingColor(new Color(225, 225, 225));
                        contentStream.setLineWidth(0.5f);
                        contentStream.addRect(
                                        LEFT_MARGIN,
                                        cursorY - rowHeight + 6,
                                        CONTENT_WIDTH,
                                        rowHeight);
                        contentStream.stroke();

                        float textY = cursorY - 14;

                        writeText(
                                        fitText(
                                                        item.beneficiaryName(),
                                                        regularFont,
                                                        8.5f,
                                                        beneficiaryWidth - 14),
                                        beneficiaryX + 8,
                                        textY,
                                        regularFont,
                                        8.5f,
                                        Color.DARK_GRAY);

                        writeText(
                                        fitText(
                                                        item.fundName(),
                                                        regularFont,
                                                        8.5f,
                                                        fundWidth - 14),
                                        fundX + 8,
                                        textY,
                                        regularFont,
                                        8.5f,
                                        Color.DARK_GRAY);

                        writeRightAlignedText(
                                        formatCurrency(item.payableAmount()),
                                        payableX + payableWidth - 8,
                                        textY,
                                        8.5f,
                                        payableWidth - 12,
                                        Color.DARK_GRAY);

                        writeRightAlignedText(
                                        formatCurrency(item.transferredAmount()),
                                        transferredX + transferredWidth - 8,
                                        textY,
                                        8.5f,
                                        transferredWidth - 12,
                                        Color.DARK_GRAY);

                        writeRightAlignedText(
                                        formatCurrency(item.pendingAmount()),
                                        pendingX + pendingWidth - 8,
                                        textY,
                                        8.5f,
                                        pendingWidth - 16,
                                        pendingTextColor);

                        cursorY -= 40;
                }

                private void writeRightAlignedText(
                                String value,
                                float rightX,
                                float y,
                                float fontSize,
                                float maxWidth,
                                Color color)
                                throws IOException {

                        String fittedValue = fitText(
                                        value,
                                        boldFont,
                                        fontSize,
                                        maxWidth);

                        float textWidth = boldFont.getStringWidth(fittedValue)
                                        / 1000f
                                        * fontSize;

                        writeText(
                                        fittedValue,
                                        rightX - textWidth,
                                        y,
                                        boldFont,
                                        fontSize,
                                        color);
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

                void writeSignatureColumns(
                                String leftLabel,
                                String leftName,
                                String leftTitle,
                                String rightLabel,
                                String rightName,
                                String rightTitle) throws IOException {

                        ensureSpace(120);

                        float columnGap = 24f;
                        float columnWidth = (CONTENT_WIDTH - columnGap) / 2f;

                        float leftX = LEFT_MARGIN;
                        float rightX = LEFT_MARGIN + columnWidth + columnGap;

                        float labelY = cursorY;
                        float lineY = cursorY - 38;

                        writeText(
                                        leftLabel,
                                        leftX,
                                        labelY,
                                        boldFont,
                                        10,
                                        Color.DARK_GRAY);

                        writeText(
                                        rightLabel,
                                        rightX,
                                        labelY,
                                        boldFont,
                                        10,
                                        Color.DARK_GRAY);

                        contentStream.setStrokingColor(Color.DARK_GRAY);
                        contentStream.setLineWidth(0.7f);

                        contentStream.moveTo(leftX, lineY);
                        contentStream.lineTo(leftX + columnWidth, lineY);

                        contentStream.moveTo(rightX, lineY);
                        contentStream.lineTo(rightX + columnWidth, lineY);

                        contentStream.stroke();

                        writeSignatureIdentity(
                                        leftX,
                                        lineY,
                                        columnWidth,
                                        leftName,
                                        leftTitle);

                        writeSignatureIdentity(
                                        rightX,
                                        lineY,
                                        columnWidth,
                                        rightName,
                                        rightTitle);

                        cursorY = lineY - 58;
                }

                private void writeSignatureIdentity(
                                float x,
                                float lineY,
                                float width,
                                String name,
                                String title) throws IOException {

                        if (name != null && !name.isBlank()) {
                                writeText(
                                                fitText(name, boldFont, 9.5f, width),
                                                x,
                                                lineY - 17,
                                                boldFont,
                                                9.5f,
                                                Color.DARK_GRAY);
                        }

                        if (title != null && !title.isBlank()) {
                                writeText(
                                                fitText(title, regularFont, 8.5f, width),
                                                x,
                                                lineY - 31,
                                                regularFont,
                                                8.5f,
                                                Color.GRAY);
                        }
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

                                                float availableLabelWidth = CONTENT_WIDTH - indent - pageNumberWidth
                                                                - 24;

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

                        String pageText = "FluxFund | Página " + pageNumber;

                        float pageTextWidth = regularFont.getStringWidth(pageText)
                                        / 1000f
                                        * 8f;

                        float maxIdentityWidth = CONTENT_WIDTH - pageTextWidth - 20f;

                        String identity = fitText(
                                        footerIdentity,
                                        regularFont,
                                        8f,
                                        maxIdentityWidth);

                        writeText(
                                        stream,
                                        identity,
                                        LEFT_MARGIN,
                                        28,
                                        regularFont,
                                        8,
                                        Color.GRAY);

                        writeText(
                                        stream,
                                        pageText,
                                        PAGE_WIDTH - RIGHT_MARGIN - pageTextWidth,
                                        28,
                                        regularFont,
                                        8,
                                        Color.GRAY);
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

                private List<String> wrapText(
                                String value,
                                PDFont font,
                                float fontSize,
                                float maxWidth)
                                throws IOException {

                        String normalizedValue = sanitizeText(value);

                        if (normalizedValue.isBlank()) {
                                return List.of("-");
                        }

                        String[] words = normalizedValue.split("\\s+");
                        List<String> lines = new ArrayList<>();
                        StringBuilder currentLine = new StringBuilder();

                        for (String word : words) {
                                String candidate = currentLine.isEmpty()
                                                ? word
                                                : currentLine + " " + word;

                                float width = font.getStringWidth(candidate)
                                                / 1000f
                                                * fontSize;

                                if (width <= maxWidth) {
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
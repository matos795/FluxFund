package com.fluxfund.api.domain.closingdossier.service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.fluxfund.api.domain.account.Account;
import com.fluxfund.api.domain.account.repository.AccountRepository;
import com.fluxfund.api.domain.attachment.Attachment;
import com.fluxfund.api.domain.attachment.repository.AttachmentRepository;
import com.fluxfund.api.domain.audit.AuditAction;
import com.fluxfund.api.domain.audit.AuditEntityType;
import com.fluxfund.api.domain.audit.service.AuditLogService;
import com.fluxfund.api.domain.bankstatementdocument.BankStatementDocument;
import com.fluxfund.api.domain.bankstatementdocument.repository.BankStatementDocumentRepository;
import com.fluxfund.api.domain.closingdossier.ClosingDossierExtraDocument;
import com.fluxfund.api.domain.closingdossier.dto.ClosingDossierAccountPreviewResponse;
import com.fluxfund.api.domain.closingdossier.dto.ClosingDossierPreviewRequest;
import com.fluxfund.api.domain.closingdossier.dto.ClosingDossierPreviewResponse;
import com.fluxfund.api.domain.closingdossier.export.ClosingDossierCreditCardStatement;
import com.fluxfund.api.domain.closingdossier.export.ClosingDossierExportAccount;
import com.fluxfund.api.domain.closingdossier.export.ClosingDossierExportExtraDocument;
import com.fluxfund.api.domain.closingdossier.export.ClosingDossierPdfGenerator;
import com.fluxfund.api.domain.closingdossier.repository.ClosingDossierExtraDocumentRepository;
import com.fluxfund.api.domain.creditcardstatement.CreditCardStatement;
import com.fluxfund.api.domain.creditcardstatement.CreditCardStatementStatus;
import com.fluxfund.api.domain.creditcardstatement.repository.CreditCardStatementRepository;
import com.fluxfund.api.domain.financialtransaction.FinancialTransaction;
import com.fluxfund.api.domain.financialtransaction.FinancialTransactionStatus;
import com.fluxfund.api.domain.financialtransaction.FinancialTransactionType;
import com.fluxfund.api.domain.financialtransaction.repository.FinancialTransactionRepository;
import com.fluxfund.api.domain.organization.Organization;
import com.fluxfund.api.domain.organization.OrganizationRepository;
import com.fluxfund.api.shared.exception.BusinessException;
import com.fluxfund.api.shared.exception.ResourceNotFoundException;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class ClosingDossierExportService {

        private final ClosingDossierService closingDossierService;
        private final ClosingDossierPdfGenerator pdfGenerator;

        private final OrganizationRepository organizationRepository;
        private final AccountRepository accountRepository;
        private final FinancialTransactionRepository financialTransactionRepository;
        private final AttachmentRepository attachmentRepository;
        private final BankStatementDocumentRepository bankStatementDocumentRepository;
        private final AuditLogService auditLogService;
        private final CreditCardStatementRepository creditCardStatementRepository;
        private final ClosingDossierExtraDocumentRepository closingDossierExtraDocumentRepository;

        public byte[] export(
                        UUID organizationId,
                        ClosingDossierPreviewRequest request) {

                ClosingDossierPreviewResponse preview = closingDossierService.preview(organizationId, request);

                Organization organization = organizationRepository
                                .findByIdAndActiveTrue(organizationId)
                                .orElseThrow(() -> new ResourceNotFoundException("Organization not found"));

                List<Account> accounts = accountRepository
                                .findAllByIdInAndOrganizationIdAndActiveTrue(
                                                request.accountIds(),
                                                organizationId);

                Map<UUID, Account> accountsById = accounts.stream()
                                .collect(Collectors.toMap(Account::getId, account -> account));

                List<FinancialTransaction> transactions = financialTransactionRepository.findSettledForClosingDossier(
                                organizationId,
                                request.accountIds(),
                                request.periodStartDate(),
                                request.periodEndDate(),
                                resolveSelectedTypes(request));

                Map<UUID, List<FinancialTransaction>> transactionsByAccountId = transactions.stream()
                                .collect(Collectors.groupingBy(
                                                transaction -> transaction.getAccount().getId()));

                Map<UUID, List<BankStatementDocument>> statementsByAccountId = bankStatementDocumentRepository
                                .findAllForAccountsAndOverlappingPeriod(
                                                organizationId,
                                                request.accountIds(),
                                                request.periodStartDate(),
                                                request.periodEndDate())
                                .stream()
                                .collect(Collectors.groupingBy(
                                                statement -> statement.getAccount().getId()));

                List<CreditCardStatement> creditCardStatements = loadCreditCardStatementsForDossier(
                                organizationId,
                                transactions);

                List<FinancialTransaction> creditCardStatementItems = loadCreditCardStatementItems(
                                organizationId,
                                creditCardStatements);

                List<FinancialTransaction> transactionsWithDocuments = new ArrayList<>(transactions);

                transactionsWithDocuments.addAll(creditCardStatementItems);

                Map<UUID, List<Attachment>> attachmentsByTransactionId = loadAttachmentsByTransactionId(
                                organizationId,
                                transactionsWithDocuments);

                Map<UUID, ClosingDossierCreditCardStatement> creditCardStatementsByPaymentTransactionId = buildCreditCardStatementsByPaymentTransactionId(
                                creditCardStatements,
                                creditCardStatementItems,
                                attachmentsByTransactionId);

                Set<UUID> creditCardStatementItemIds = creditCardStatementItems.stream()
                                .map(FinancialTransaction::getId)
                                .collect(Collectors.toSet());

                List<ClosingDossierExportAccount> exportAccounts = new ArrayList<>();

                for (ClosingDossierAccountPreviewResponse accountPreview : preview.accounts()) {

                        if (!accountPreview.includedInDossier()) {
                                continue;
                        }

                        Account account = accountsById.get(accountPreview.accountId());

                        if (account == null) {
                                continue;
                        }

                        List<FinancialTransaction> accountTransactions = transactionsByAccountId.getOrDefault(
                                        account.getId(),
                                        List.of());

                        Map<UUID, ClosingDossierCreditCardStatement> accountCreditCardStatements = accountTransactions
                                        .stream()
                                        .map(FinancialTransaction::getId)
                                        .filter(
                                                        creditCardStatementsByPaymentTransactionId::containsKey)
                                        .collect(Collectors.toMap(
                                                        transactionId -> transactionId,
                                                        creditCardStatementsByPaymentTransactionId::get));

                        Set<UUID> accountCreditCardStatementItemIds = accountTransactions.stream()
                                        .map(FinancialTransaction::getId)
                                        .filter(creditCardStatementItemIds::contains)
                                        .collect(Collectors.toSet());

                        exportAccounts.add(new ClosingDossierExportAccount(
                                        account,
                                        accountPreview,
                                        statementsByAccountId.getOrDefault(
                                                        account.getId(),
                                                        List.of()),
                                        accountTransactions,
                                        attachmentsByTransactionId,
                                        accountCreditCardStatements,
                                        accountCreditCardStatementItemIds));
                }

                if (exportAccounts.isEmpty()) {
                        throw new BusinessException(
                                        "There are no accounts to include in the closing dossier");
                }

                List<ClosingDossierExportExtraDocument> extraDocuments = closingDossierExtraDocumentRepository
                                .findAllByOrganizationIdAndPeriodStartDateAndPeriodEndDateOrderBySortOrderAscUploadedAtAsc(
                                                organizationId,
                                                request.periodStartDate(),
                                                request.periodEndDate())
                                .stream()
                                .map(this::toExportExtraDocument)
                                .toList();

                byte[] pdf = pdfGenerator.generate(
                                organization,
                                request,
                                preview,
                                exportAccounts,
                                extraDocuments);

                auditLogService.record(
                                organizationId,
                                AuditEntityType.CLOSING_DOSSIER,
                                UUID.randomUUID(),
                                AuditAction.GENERATE_CLOSING_DOSSIER,
                                "Closing dossier generated from "
                                                + request.periodStartDate()
                                                + " to "
                                                + request.periodEndDate()
                                                + " for "
                                                + exportAccounts.size()
                                                + " account(s)");

                return pdf;
        }

        private Map<UUID, List<Attachment>> loadAttachmentsByTransactionId(
                        UUID organizationId,
                        List<FinancialTransaction> transactions) {

                List<UUID> transactionIds = transactions.stream()
                                .map(FinancialTransaction::getId)
                                .distinct()
                                .toList();

                if (transactionIds.isEmpty()) {
                        return Map.of();
                }

                return attachmentRepository
                                .findAllByTransactionIdsForExport(
                                                organizationId,
                                                transactionIds)
                                .stream()
                                .collect(Collectors.groupingBy(
                                                attachment -> attachment.getFinancialTransaction().getId()));
        }

        private ClosingDossierExportExtraDocument toExportExtraDocument(
                        ClosingDossierExtraDocument document) {

                return new ClosingDossierExportExtraDocument(
                                document.getId(),
                                document.getDocumentType(),
                                document.getTitle(),
                                document.getOriginalFilename(),
                                document.getStorageKey(),
                                document.getSortOrder());
        }

        private List<FinancialTransactionType> resolveSelectedTypes(
                        ClosingDossierPreviewRequest request) {

                List<FinancialTransactionType> types = new ArrayList<>();

                if (Boolean.TRUE.equals(request.includeIncomes())) {
                        types.add(FinancialTransactionType.INCOME);
                }

                if (request.includeExpenses() == null
                                || Boolean.TRUE.equals(request.includeExpenses())) {
                        types.add(FinancialTransactionType.EXPENSE);
                }

                if (Boolean.TRUE.equals(request.includeTransfers())) {
                        types.add(FinancialTransactionType.TRANSFER);
                }

                if (types.isEmpty()) {
                        throw new BusinessException(
                                        "Select at least one transaction type for the closing dossier");
                }

                return types;
        }

        private List<CreditCardStatement> loadCreditCardStatementsForDossier(
                        UUID organizationId,
                        List<FinancialTransaction> transactions) {

                List<UUID> paymentTransactionIds = transactions.stream()
                                .map(FinancialTransaction::getId)
                                .toList();

                if (paymentTransactionIds.isEmpty()) {
                        return List.of();
                }

                return creditCardStatementRepository
                                .findPaidForClosingDossier(
                                                organizationId,
                                                CreditCardStatementStatus.PAID,
                                                paymentTransactionIds);
        }

        private List<FinancialTransaction> loadCreditCardStatementItems(
                        UUID organizationId,
                        List<CreditCardStatement> statements) {

                List<UUID> statementIds = statements.stream()
                                .map(CreditCardStatement::getId)
                                .toList();

                if (statementIds.isEmpty()) {
                        return List.of();
                }

                return financialTransactionRepository
                                .findCreditCardStatementItemsForClosingDossier(
                                                organizationId,
                                                statementIds,
                                                FinancialTransactionStatus.CANCELED);
        }

        private Map<UUID, ClosingDossierCreditCardStatement> buildCreditCardStatementsByPaymentTransactionId(
                        List<CreditCardStatement> statements,
                        List<FinancialTransaction> items,
                        Map<UUID, List<Attachment>> attachmentsByTransactionId) {

                Map<UUID, List<FinancialTransaction>> itemsByStatementId = items.stream()
                                .collect(Collectors.groupingBy(
                                                item -> item.getCreditCardStatement().getId()));

                return statements.stream()
                                .collect(Collectors.toMap(
                                                statement -> statement.getPaymentTransaction().getId(),
                                                statement -> new ClosingDossierCreditCardStatement(
                                                                statement,
                                                                itemsByStatementId.getOrDefault(
                                                                                statement.getId(),
                                                                                List.of()),
                                                                attachmentsByTransactionId),
                                                (first, second) -> {
                                                        throw new BusinessException(
                                                                        "More than one credit card statement is linked "
                                                                                        + "to the same payment transaction");
                                                }));
        }
}
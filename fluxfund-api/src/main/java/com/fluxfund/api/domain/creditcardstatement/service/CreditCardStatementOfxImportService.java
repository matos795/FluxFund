package com.fluxfund.api.domain.creditcardstatement.service;

import java.io.InputStream;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.fluxfund.api.domain.account.Account;
import com.fluxfund.api.domain.creditcardstatement.CreditCardStatement;
import com.fluxfund.api.domain.creditcardstatement.CreditCardStatementPayment;
import com.fluxfund.api.domain.creditcardstatement.CreditCardStatementStatus;
import com.fluxfund.api.domain.creditcardstatement.dto.CreditCardStatementImportResponse;
import com.fluxfund.api.domain.creditcardstatement.repository.CreditCardStatementPaymentRepository;
import com.fluxfund.api.domain.creditcardstatement.repository.CreditCardStatementRepository;
import com.fluxfund.api.domain.financialtransaction.FinancialTransaction;
import com.fluxfund.api.domain.financialtransaction.FinancialTransactionSource;
import com.fluxfund.api.domain.financialtransaction.FinancialTransactionStatus;
import com.fluxfund.api.domain.financialtransaction.FinancialTransactionType;
import com.fluxfund.api.domain.financialtransaction.dto.FinancialTransactionResponse;
import com.fluxfund.api.domain.financialtransaction.mapper.FinancialTransactionMapper;
import com.fluxfund.api.domain.financialtransaction.repository.FinancialTransactionRepository;
import com.fluxfund.api.domain.organization.Organization;
import com.fluxfund.api.security.OrganizationAccessService;
import com.fluxfund.api.shared.exception.BusinessException;
import com.fluxfund.api.shared.exception.ResourceNotFoundException;
import com.fluxfund.api.shared.ofx.OfxTextNormalizer;
import com.webcohesion.ofx4j.domain.data.MessageSetType;
import com.webcohesion.ofx4j.domain.data.ResponseEnvelope;
import com.webcohesion.ofx4j.domain.data.banking.BankStatementResponse;
import com.webcohesion.ofx4j.domain.data.banking.BankStatementResponseTransaction;
import com.webcohesion.ofx4j.domain.data.banking.BankingResponseMessageSet;
import com.webcohesion.ofx4j.domain.data.common.StatementResponse;
import com.webcohesion.ofx4j.domain.data.common.Transaction;
import com.webcohesion.ofx4j.domain.data.creditcard.CreditCardResponseMessageSet;
import com.webcohesion.ofx4j.domain.data.creditcard.CreditCardStatementResponse;
import com.webcohesion.ofx4j.domain.data.creditcard.CreditCardStatementResponseTransaction;
import com.webcohesion.ofx4j.io.AggregateUnmarshaller;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class CreditCardStatementOfxImportService {

    private final CreditCardStatementRepository statementRepository;
    private final FinancialTransactionRepository financialTransactionRepository;
    private final OrganizationAccessService organizationAccessService;
    private final OfxTextNormalizer ofxTextNormalizer;
    private final CreditCardStatementPaymentRepository paymentRepository;
    private final CreditCardOfxEntryClassifier entryClassifier;

    public CreditCardStatementImportResponse importOfx(
            UUID organizationId,
            UUID statementId,
            MultipartFile file) {

        organizationAccessService.requireFinanceWriteAccess(organizationId);
        validateFile(file);

        CreditCardStatement creditCardStatement = statementRepository
                .findByIdAndOrganizationId(statementId, organizationId)
                .orElseThrow(() -> new ResourceNotFoundException("Credit card statement not found"));

        if (creditCardStatement.getStatus() == CreditCardStatementStatus.PAID
                || creditCardStatement.getStatus() == CreditCardStatementStatus.CANCELED) {
            throw new BusinessException("Cannot import items into paid or canceled statements");
        }

        Organization organization = creditCardStatement.getOrganization();
        Account creditCardAccount = creditCardStatement.getCreditCardAccount();

        int imported = 0;

        int detectedPayments = 0;

        int reconciledPayments = 0;

        int ignoredDuplicates = 0;

        int reviewRequired = 0;

        int failed = 0;

        List<FinancialTransactionResponse> importedItems = new ArrayList<>();

        List<String> warnings = new ArrayList<>();

        List<String> errors = new ArrayList<>();

        try (InputStream inputStream = file.getInputStream()) {
            AggregateUnmarshaller<ResponseEnvelope> unmarshaller = new AggregateUnmarshaller<>(ResponseEnvelope.class);

            ResponseEnvelope envelope = unmarshaller.unmarshal(inputStream);

            List<Transaction> transactions = extractTransactions(envelope);

            for (Transaction ofxTransaction : transactions) {
                try {
                    String externalId = normalizeExternalId(ofxTransaction);

                    if (externalId == null || externalId.isBlank()) {
                        failed++;
                        errors.add("Transação sem FITID ignorada.");
                        continue;
                    }

                    String description = buildDescription(ofxTransaction);

                    CreditCardOfxEntryType entryType = entryClassifier.classify(
                            ofxTransaction,
                            description);

                    switch (entryType) {

                        case EXPENSE -> {

                            var existingItem = financialTransactionRepository
                                    .findByOrganizationIdAndAccountIdAndExternalId(
                                            organizationId,
                                            creditCardAccount.getId(),
                                            externalId);

                            if (existingItem.isPresent()) {

                                FinancialTransaction existingTransaction = existingItem.get();

                                boolean belongsToCurrentStatement = existingTransaction.getCreditCardStatement() != null

                                        && existingTransaction
                                                .getCreditCardStatement()
                                                .getId()
                                                .equals(statementId);

                                if (belongsToCurrentStatement) {

                                    ignoredDuplicates++;
                                    continue;
                                }

                                boolean canRecoverFromCanceledStatement = existingTransaction
                                        .getSource() == FinancialTransactionSource.CREDIT_CARD

                                        && existingTransaction.getStatus() == FinancialTransactionStatus.CANCELED

                                        && existingTransaction.getCreditCardStatement() != null

                                        && existingTransaction
                                                .getCreditCardStatement()
                                                .getStatus() == CreditCardStatementStatus.CANCELED;

                                if (!canRecoverFromCanceledStatement) {

                                    reviewRequired++;

                                    warnings.add(
                                            "O lançamento \""
                                                    + description
                                                    + "\" já pertence a outra fatura ativa.");

                                    continue;
                                }

                                restoreCanceledCreditCardItem(
                                        existingTransaction,
                                        creditCardAccount,
                                        creditCardStatement,
                                        ofxTransaction);

                                FinancialTransaction restoredTransaction = financialTransactionRepository
                                        .save(existingTransaction);

                                importedItems.add(
                                        FinancialTransactionMapper
                                                .toResponse(restoredTransaction));

                                imported++;

                                continue;
                            }

                            FinancialTransaction financialTransaction = createCreditCardItemFromOfx(
                                    organization,
                                    creditCardAccount,
                                    creditCardStatement,
                                    ofxTransaction,
                                    externalId);

                            FinancialTransaction savedTransaction = financialTransactionRepository
                                    .save(financialTransaction);

                            importedItems.add(
                                    FinancialTransactionMapper
                                            .toResponse(savedTransaction));

                            imported++;
                        }

                        case PAYMENT -> {

                            PaymentImportResult result = importStatementPayment(
                                    organizationId,
                                    creditCardStatement,
                                    ofxTransaction,
                                    externalId,
                                    description,
                                    warnings);

                            switch (result) {
                                case CREATED ->
                                    detectedPayments++;

                                case RECONCILED ->
                                    reconciledPayments++;

                                case DUPLICATE ->
                                    ignoredDuplicates++;

                                case REVIEW_REQUIRED ->
                                    reviewRequired++;
                            }
                        }

                        case REVIEW_REQUIRED -> {

                            reviewRequired++;

                            warnings.add(
                                    "Crédito da fatura precisa de revisão: "
                                            + description
                                            + " · valor "
                                            + ofxTransaction.getBigDecimalAmount());
                        }
                    }

                } catch (BusinessException exception) {

                    failed++;

                    errors.add(
                            "Erro ao importar transação: "
                                    + exception.getMessage());
                }
            }

            return new CreditCardStatementImportResponse(
                    imported,
                    detectedPayments,
                    reconciledPayments,
                    ignoredDuplicates,
                    importedItems,
                    reviewRequired,
                    failed,
                    warnings,
                    errors);

        } catch (BusinessException exception) {
            throw exception;
        } catch (Exception exception) {
            throw new BusinessException("Could not import credit card OFX file: " + exception.getMessage());
        }
    }

    private List<Transaction> extractTransactions(ResponseEnvelope envelope) {
        List<Transaction> creditCardTransactions = extractCreditCardTransactions(envelope);

        if (!creditCardTransactions.isEmpty()) {
            return creditCardTransactions;
        }

        List<Transaction> bankingTransactions = extractBankingTransactions(envelope);

        if (!bankingTransactions.isEmpty()) {
            return bankingTransactions;
        }

        throw new BusinessException("OFX file não contém transações de cartão de crédito.");
    }

    private List<Transaction> extractCreditCardTransactions(ResponseEnvelope envelope) {
        CreditCardResponseMessageSet creditCardResponse = (CreditCardResponseMessageSet) envelope
                .getMessageSet(MessageSetType.creditcard);

        if (creditCardResponse == null
                || creditCardResponse.getStatementResponses() == null
                || creditCardResponse.getStatementResponses().isEmpty()) {
            return List.of();
        }

        CreditCardStatementResponseTransaction statementTransaction = creditCardResponse.getStatementResponses().get(0);

        CreditCardStatementResponse statement = statementTransaction.getMessage();

        return getTransactions(statement);
    }

    private List<Transaction> extractBankingTransactions(ResponseEnvelope envelope) {
        BankingResponseMessageSet bankResponse = (BankingResponseMessageSet) envelope
                .getMessageSet(MessageSetType.banking);

        if (bankResponse == null
                || bankResponse.getStatementResponses() == null
                || bankResponse.getStatementResponses().isEmpty()) {
            return List.of();
        }

        BankStatementResponseTransaction statementTransaction = bankResponse.getStatementResponses().get(0);

        BankStatementResponse statement = statementTransaction.getMessage();

        return getTransactions(statement);
    }

    private List<Transaction> getTransactions(StatementResponse statement) {
        if (statement == null
                || statement.getTransactionList() == null
                || statement.getTransactionList().getTransactions() == null) {
            return List.of();
        }

        return statement.getTransactionList().getTransactions();
    }

    private void validateFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BusinessException("OFX file is required");
        }

        String filename = file.getOriginalFilename();

        if (filename == null || !filename.toLowerCase().endsWith(".ofx")) {
            throw new BusinessException("File must be an OFX file");
        }
    }

    private FinancialTransaction createCreditCardItemFromOfx(
            Organization organization,
            Account creditCardAccount,
            CreditCardStatement creditCardStatement,
            Transaction ofxTransaction,
            String externalId) {

        BigDecimal amount = requireAmount(ofxTransaction);

        if (amount.compareTo(BigDecimal.ZERO) == 0) {
            throw new BusinessException("Transaction amount must be different from zero");
        }

        BigDecimal absoluteAmount = amount.abs();

        if (ofxTransaction.getDatePosted() == null) {
            throw new BusinessException(
                    "Transaction purchase date must be provided");
        }

        LocalDate purchaseDate = ofxTransaction.getDatePosted()
                .toInstant()
                .atZone(ZoneId.systemDefault())
                .toLocalDate();

        String rawDescription = buildDescription(ofxTransaction);

        FinancialTransaction financialTransaction = new FinancialTransaction();

        financialTransaction.setOrganization(organization);
        financialTransaction.setAccount(creditCardAccount);
        financialTransaction.setCreditCardStatement(creditCardStatement);

        financialTransaction.setCategory(null);
        financialTransaction.setType(FinancialTransactionType.EXPENSE);
        financialTransaction.setSource(FinancialTransactionSource.CREDIT_CARD);

        financialTransaction.setStatus(FinancialTransactionStatus.PENDING);

        financialTransaction.setPurchaseDate(purchaseDate);
        financialTransaction.setDueDate(creditCardStatement.getDueDate());
        financialTransaction.setSettlementDate(null);

        financialTransaction.setExpectedAmount(absoluteAmount);
        financialTransaction.setSettledAmount(null);

        financialTransaction.setInterestAmount(BigDecimal.ZERO);
        financialTransaction.setDiscountAmount(BigDecimal.ZERO);

        financialTransaction.setRawDescription(rawDescription);
        financialTransaction.setDescription("");

        financialTransaction.setImportedAt(LocalDateTime.now());
        financialTransaction.setDocumentNumber(ofxTransaction.getCheckNumber());
        financialTransaction.setExternalId(externalId);
        financialTransaction.setClassifiedAt(null);

        return financialTransaction;
    }

    private String normalizeExternalId(Transaction transaction) {
        if (transaction.getId() == null) {
            return null;
        }

        return transaction.getId().trim();
    }

    private String buildDescription(
            Transaction transaction) {

        if (transaction.getMemo() != null
                && !transaction.getMemo().isBlank()) {

            return normalizeDescription(
                    transaction.getMemo());
        }

        if (transaction.getName() != null
                && !transaction.getName().isBlank()) {

            return normalizeDescription(
                    transaction.getName());
        }

        return "Item de cartão importado via OFX";
    }

    private String normalizeDescription(
            String value) {

        return ofxTextNormalizer
                .normalize(value)
                .trim();
    }

    private enum PaymentImportResult {
        CREATED,
        RECONCILED,
        DUPLICATE,
        REVIEW_REQUIRED
    }

    private PaymentImportResult importStatementPayment(

            UUID organizationId,

            CreditCardStatement statement,

            Transaction ofxTransaction,

            String externalId,

            String description,

            List<String> warnings) {

        if (paymentRepository
                .existsByOrganizationIdAndStatementIdAndStatementExternalId(
                        organizationId,
                        statement.getId(),
                        externalId)) {

            return PaymentImportResult.DUPLICATE;
        }

        var legacyItem = financialTransactionRepository
                .findByOrganizationIdAndCreditCardStatementIdAndExternalId(
                        organizationId,
                        statement.getId(),
                        externalId);

        if (legacyItem.isPresent()

                && legacyItem.get().getStatus() != FinancialTransactionStatus.CANCELED) {

            warnings.add(
                    "O pagamento \""
                            + description
                            + "\" ainda existe como item ativo da fatura. "
                            + "Cancele esse item incorreto antes de reimportar.");

            return PaymentImportResult.REVIEW_REQUIRED;
        }

        BigDecimal amount = requireAmount(ofxTransaction)
                .abs();

        LocalDate paymentDate = requirePostedDate(ofxTransaction);

        List<CreditCardStatementPayment> possibleMatches = paymentRepository
                .findPossibleStatementMatches(
                        organizationId,
                        statement.getId(),
                        amount,
                        paymentDate.minusDays(3),
                        paymentDate.plusDays(3));

        if (possibleMatches.size() > 1) {

            warnings.add(
                    "Mais de um pagamento existente pode corresponder a \""
                            + description
                            + "\". Faça a conciliação manual.");

            return PaymentImportResult.REVIEW_REQUIRED;
        }

        if (possibleMatches.size() == 1) {

            CreditCardStatementPayment existingPayment = possibleMatches.get(0);

            fillStatementImportData(
                    existingPayment,
                    ofxTransaction,
                    externalId,
                    description);

            paymentRepository.save(existingPayment);

            return PaymentImportResult.RECONCILED;
        }

        CreditCardStatementPayment payment = new CreditCardStatementPayment();

        payment.setOrganization(
                statement.getOrganization());

        payment.setStatement(statement);

        payment.setPaymentDate(paymentDate);

        payment.setAmount(amount);

        fillStatementImportData(
                payment,
                ofxTransaction,
                externalId,
                description);

        paymentRepository.save(payment);

        return PaymentImportResult.CREATED;
    }

    private void fillStatementImportData(

            CreditCardStatementPayment payment,

            Transaction transaction,

            String externalId,

            String description) {

        payment.setStatementExternalId(
                externalId);

        payment.setStatementRawDescription(
                description);

        payment.setStatementTransactionType(
                transaction.getTransactionType() != null
                        ? transaction
                                .getTransactionType()
                                .name()
                        : null);
    }

    private BigDecimal requireAmount(
            Transaction transaction) {

        BigDecimal amount = transaction.getBigDecimalAmount();

        if (amount == null
                || amount.compareTo(BigDecimal.ZERO) == 0) {

            throw new BusinessException(
                    "Transaction amount must be different from zero");
        }

        return amount;
    }

    private LocalDate requirePostedDate(
            Transaction transaction) {

        if (transaction.getDatePosted() == null) {

            throw new BusinessException(
                    "Transaction date must be provided");
        }

        return transaction
                .getDatePosted()
                .toInstant()
                .atZone(ZoneId.systemDefault())
                .toLocalDate();
    }

    private void restoreCanceledCreditCardItem(

            FinancialTransaction transaction,

            Account creditCardAccount,

            CreditCardStatement statement,

            Transaction ofxTransaction) {

        BigDecimal amount = requireAmount(ofxTransaction)
                .abs();

        LocalDate purchaseDate = requirePostedDate(ofxTransaction);

        transaction.setAccount(
                creditCardAccount);

        transaction.setCreditCardStatement(
                statement);

        transaction.setType(
                FinancialTransactionType.EXPENSE);

        transaction.setSource(
                FinancialTransactionSource.CREDIT_CARD);

        transaction.setStatus(
                FinancialTransactionStatus.PENDING);

        transaction.setTransferDirection(null);

        transaction.setTransferGroupId(null);

        transaction.setTransferCounterpartyAccount(null);

        transaction.setPurchaseDate(
                purchaseDate);

        transaction.setDueDate(
                statement.getDueDate());

        transaction.setSettlementDate(null);

        transaction.setExpectedAmount(
                amount);

        transaction.setSettledAmount(null);

        transaction.setInterestAmount(
                BigDecimal.ZERO);

        transaction.setDiscountAmount(
                BigDecimal.ZERO);

        transaction.setRawDescription(
                buildDescription(ofxTransaction));

        transaction.setImportedAt(
                LocalDateTime.now());

        transaction.setDocumentNumber(
                ofxTransaction.getCheckNumber());
    }
}
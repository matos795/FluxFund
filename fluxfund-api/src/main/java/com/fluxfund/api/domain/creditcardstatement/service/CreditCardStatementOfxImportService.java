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
import com.fluxfund.api.domain.creditcardstatement.CreditCardStatementStatus;
import com.fluxfund.api.domain.creditcardstatement.dto.CreditCardStatementImportResponse;
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
        int ignoredDuplicates = 0;
        int failed = 0;

        List<FinancialTransactionResponse> importedItems = new ArrayList<>();
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

                    boolean alreadyExists = financialTransactionRepository
                            .existsByOrganizationIdAndCreditCardStatementIdAndExternalId(
                                    organizationId,
                                    statementId,
                                    externalId);

                    if (alreadyExists) {
                        ignoredDuplicates++;
                        continue;
                    }

                    FinancialTransaction financialTransaction = createCreditCardItemFromOfx(
                            organization,
                            creditCardAccount,
                            creditCardStatement,
                            ofxTransaction,
                            externalId);

                    FinancialTransaction savedTransaction = financialTransactionRepository.save(financialTransaction);

                    importedItems.add(FinancialTransactionMapper.toResponse(savedTransaction));
                    imported++;
                } catch (Exception exception) {
                    failed++;
                    errors.add("Erro ao importar transação: " + exception.getMessage());
                }
            }

            return new CreditCardStatementImportResponse(
                    imported,
                    ignoredDuplicates,
                    importedItems,
                    failed,
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

        Double amountDouble = ofxTransaction.getAmount();

        if (amountDouble == null) {
            throw new BusinessException("Transaction amount must be provided");
        }

        BigDecimal amount = BigDecimal.valueOf(amountDouble);

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

    private String buildDescription(Transaction transaction) {
        if (transaction.getMemo() != null && !transaction.getMemo().isBlank()) {
            return transaction.getMemo().trim();
        }

        if (transaction.getName() != null && !transaction.getName().isBlank()) {
            return transaction.getName().trim();
        }

        return "Item de cartão importado via OFX";
    }
}
package com.fluxfund.api.domain.financialtransaction.service;

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
import com.fluxfund.api.domain.account.repository.AccountRepository;
import com.fluxfund.api.domain.financialtransaction.FinancialTransaction;
import com.fluxfund.api.domain.financialtransaction.FinancialTransactionSource;
import com.fluxfund.api.domain.financialtransaction.FinancialTransactionStatus;
import com.fluxfund.api.domain.financialtransaction.FinancialTransactionType;
import com.fluxfund.api.domain.financialtransaction.dto.ImportOfxResponse;
import com.fluxfund.api.domain.financialtransaction.repository.FinancialTransactionRepository;
import com.fluxfund.api.domain.organization.Organization;
import com.fluxfund.api.domain.organization.OrganizationRepository;
import com.fluxfund.api.shared.exception.BusinessException;
import com.fluxfund.api.shared.exception.ResourceNotFoundException;
import com.webcohesion.ofx4j.domain.data.MessageSetType;
import com.webcohesion.ofx4j.domain.data.ResponseEnvelope;
import com.webcohesion.ofx4j.domain.data.banking.BankStatementResponse;
import com.webcohesion.ofx4j.domain.data.banking.BankStatementResponseTransaction;
import com.webcohesion.ofx4j.domain.data.banking.BankingResponseMessageSet;
import com.webcohesion.ofx4j.domain.data.common.Transaction;
import com.webcohesion.ofx4j.io.AggregateUnmarshaller;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class OfxImportService {

    private final FinancialTransactionRepository financialTransactionRepository;
    private final OrganizationRepository organizationRepository;
    private final AccountRepository accountRepository;

    public ImportOfxResponse importOfx(
            UUID organizationId,
            UUID accountId,
            MultipartFile file) {
        validateFile(file);

        Organization organization = organizationRepository.findByIdAndActiveTrue(organizationId)
                .orElseThrow(() -> new ResourceNotFoundException("Organization not found"));

        Account account = accountRepository.findByIdAndOrganizationIdAndActiveTrue(accountId, organizationId)
                .orElseThrow(() -> new ResourceNotFoundException("Account not found"));

        int imported = 0;
        int ignoredDuplicates = 0;
        int failed = 0;
        List<String> errors = new ArrayList<>();

        try (InputStream inputStream = file.getInputStream()) {
            AggregateUnmarshaller<ResponseEnvelope> unmarshaller = new AggregateUnmarshaller<>(ResponseEnvelope.class);
            ResponseEnvelope envelope = unmarshaller.unmarshal(inputStream);

            BankingResponseMessageSet bankResponse = (BankingResponseMessageSet) envelope
                    .getMessageSet(MessageSetType.banking);

            if (bankResponse == null || bankResponse.getStatementResponses() == null
                    || bankResponse.getStatementResponses().isEmpty()) {
                throw new BusinessException("OFX file não contém resposta de extrato bancário.");
            }

            BankStatementResponseTransaction statementTransaction = bankResponse.getStatementResponses().get(0);
            BankStatementResponse statement = statementTransaction.getMessage();

            List<Transaction> transactions = statement.getTransactionList().getTransactions();

            for (Transaction ofxTransaction : transactions) {
                try {
                    String externalId = normalizeExternalId(ofxTransaction);

                    if (externalId == null || externalId.isBlank()) {
                        failed++;
                        errors.add("Transação sem FITID ignorada.");
                        continue;
                    }

                    boolean alreadyExists = financialTransactionRepository
                            .existsByOrganizationIdAndAccountIdAndExternalId(
                                    organizationId,
                                    accountId,
                                    externalId);

                    if (alreadyExists) {
                        ignoredDuplicates++;
                        continue;
                    }

                    FinancialTransaction financialTransaction = createFinancialTransactionFromOfx(
                            organization,
                            account,
                            ofxTransaction,
                            externalId);

                    financialTransactionRepository.save(financialTransaction);
                    imported++;
                } catch (Exception exception) {
                    failed++;
                    errors.add("Erro ao importar transação: " + exception.getMessage());
                }
            }

            return new ImportOfxResponse(
                    imported,
                    ignoredDuplicates,
                    failed,
                    errors);
        } catch (Exception exception) {
            throw new BusinessException("Could not import OFX file: " + exception.getMessage());
        }
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

    private FinancialTransaction createFinancialTransactionFromOfx(
            Organization organization,
            Account account,
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

        FinancialTransactionType type = amount.compareTo(BigDecimal.ZERO) > 0
                ? FinancialTransactionType.INCOME
                : FinancialTransactionType.EXPENSE;

        BigDecimal absoluteAmount = amount.abs();

        LocalDate settlementDate = ofxTransaction.getDatePosted()
                .toInstant()
                .atZone(ZoneId.systemDefault())
                .toLocalDate();

        String rawDescription = buildDescription(ofxTransaction);

        FinancialTransaction financialTransaction = new FinancialTransaction();

        financialTransaction.setOrganization(organization);
        financialTransaction.setAccount(account);
        financialTransaction.setCategory(null);
        financialTransaction.setType(type);
        financialTransaction.setSource(FinancialTransactionSource.OFX);
        financialTransaction.setStatus(FinancialTransactionStatus.SETTLED);
        financialTransaction.setDueDate(settlementDate);
        financialTransaction.setSettlementDate(settlementDate);
        financialTransaction.setExpectedAmount(absoluteAmount);
        financialTransaction.setSettledAmount(absoluteAmount);
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

        return "Transação importada via OFX";
    }
}
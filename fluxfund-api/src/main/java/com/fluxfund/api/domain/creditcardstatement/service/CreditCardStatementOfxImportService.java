package com.fluxfund.api.domain.creditcardstatement.service;

import java.io.InputStream;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Objects;
import java.util.Set;
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

        private static final BigDecimal MONEY_TOLERANCE = new BigDecimal("0.02");

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

                int ignoredPreviousStatementPayments = 0;

                List<FinancialTransactionResponse> importedItems = new ArrayList<>();

                List<String> warnings = new ArrayList<>();

                List<String> errors = new ArrayList<>();

                try (InputStream inputStream = file.getInputStream()) {
                        AggregateUnmarshaller<ResponseEnvelope> unmarshaller = new AggregateUnmarshaller<>(
                                        ResponseEnvelope.class);

                        ResponseEnvelope envelope = unmarshaller.unmarshal(inputStream);

                        StatementResponse ofxStatement = extractStatement(envelope);

                        List<Transaction> transactions = getTransactions(ofxStatement);

                        PaymentPeriodAnalysis paymentAnalysis = analyzePaymentPeriod(
                                        ofxStatement,
                                        transactions);

                        creditCardStatement.setPreviousBalanceAmount(
                                        paymentAnalysis.previousBalanceAmount());

                        statementRepository.save(
                                        creditCardStatement);

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
                                                                        .findByOrganizationIdAndCreditCardStatementIdAndExternalId(
                                                                                        organizationId,
                                                                                        statementId,
                                                                                        externalId);

                                                        if (existingItem.isPresent()) {

                                                                FinancialTransaction existingTransaction = existingItem
                                                                                .get();

                                                                if (existingTransaction
                                                                                .getStatus() == FinancialTransactionStatus.CANCELED) {

                                                                        restoreCanceledCreditCardItem(
                                                                                        existingTransaction,
                                                                                        creditCardAccount,
                                                                                        creditCardStatement,
                                                                                        ofxTransaction);

                                                                        FinancialTransaction restoredTransaction = financialTransactionRepository
                                                                                        .save(existingTransaction);
                                                                        importedItems.add(FinancialTransactionMapper
                                                                                        .toResponse(restoredTransaction));
                                                                        imported++;
                                                                        warnings.add("O lançamento \"" + description
                                                                                        + "\" estava cancelado e foi restaurado.");
                                                                } else {
                                                                        ignoredDuplicates++;
                                                                }

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

                                                        if (paymentAnalysis
                                                                        .belongsToPreviousStatement(
                                                                                        externalId)) {

                                                                ignoredPreviousStatementPayments++;

                                                                warnings.add(
                                                                                "Pagamento de "
                                                                                                + requireAmount(ofxTransaction)
                                                                                                                .abs()
                                                                                                + " em "
                                                                                                + requirePostedDate(
                                                                                                                ofxTransaction)
                                                                                                + " pertence ao saldo anterior "
                                                                                                + "e não foi incluído nesta fatura.");

                                                                continue;
                                                        }

                                                        if (paymentAnalysis
                                                                        .requiresReview(
                                                                                        externalId)) {

                                                                reviewRequired++;

                                                                warnings.add(
                                                                                "O pagamento de "
                                                                                                + requireAmount(ofxTransaction)
                                                                                                                .abs()
                                                                                                + " pode abranger saldo anterior "
                                                                                                + "e saldo atual. Faça a revisão manual.");

                                                                continue;
                                                        }

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
                                        ignoredPreviousStatementPayments,
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

        private StatementResponse extractStatement(
                        ResponseEnvelope envelope) {

                StatementResponse creditCardStatement = extractCreditCardStatement(envelope);

                if (creditCardStatement != null) {
                        return creditCardStatement;
                }

                StatementResponse bankingStatement = extractBankingStatement(envelope);

                if (bankingStatement != null) {
                        return bankingStatement;
                }

                throw new BusinessException(
                                "OFX file não contém transações de cartão de crédito.");
        }

        private StatementResponse extractCreditCardStatement(
                        ResponseEnvelope envelope) {

                CreditCardResponseMessageSet creditCardResponse = (CreditCardResponseMessageSet) envelope.getMessageSet(
                                MessageSetType.creditcard);

                if (creditCardResponse == null
                                || creditCardResponse.getStatementResponses() == null
                                || creditCardResponse.getStatementResponses().isEmpty()) {

                        return null;
                }

                CreditCardStatementResponseTransaction statementTransaction = creditCardResponse
                                .getStatementResponses()
                                .get(0);

                return statementTransaction.getMessage();
        }

        private StatementResponse extractBankingStatement(
                        ResponseEnvelope envelope) {

                BankingResponseMessageSet bankResponse = (BankingResponseMessageSet) envelope.getMessageSet(
                                MessageSetType.banking);

                if (bankResponse == null
                                || bankResponse.getStatementResponses() == null
                                || bankResponse.getStatementResponses().isEmpty()) {

                        return null;
                }

                BankStatementResponseTransaction statementTransaction = bankResponse
                                .getStatementResponses()
                                .get(0);

                return statementTransaction.getMessage();
        }

        private PaymentPeriodAnalysis analyzePaymentPeriod(

                        StatementResponse statement,

                        List<Transaction> transactions) {

                if (statement.getLedgerBalance() == null
                                || statement
                                                .getLedgerBalance()
                                                .getBigDecimalAmount() == null) {

                        return PaymentPeriodAnalysis.unavailable();
                }

                BigDecimal closingBalance = statement
                                .getLedgerBalance()
                                .getBigDecimalAmount();

                BigDecimal netMovement = transactions.stream()

                                .map(Transaction::getBigDecimalAmount)

                                .filter(Objects::nonNull)

                                .reduce(
                                                BigDecimal.ZERO,
                                                BigDecimal::add);

                /*
                 * saldo final = saldo inicial + movimentações
                 *
                 * portanto:
                 *
                 * saldo inicial = saldo final - movimentações
                 */
                BigDecimal openingBalance = closingBalance.subtract(
                                netMovement);

                /*
                 * No OFX do cartão Nubank, dívida aparece negativa.
                 */
                BigDecimal remainingPreviousBalance = openingBalance.compareTo(
                                BigDecimal.ZERO) < 0

                                                ? openingBalance.abs()

                                                : BigDecimal.ZERO;

                Set<String> previousStatementPayments = new HashSet<>();

                Set<String> reviewRequiredPayments = new HashSet<>();

                List<Transaction> payments = transactions.stream()

                                /*
                                 * Somente valores positivos reduzem
                                 * a dívida de uma fatura.
                                 */
                                .filter(transaction -> {
                                        BigDecimal amount = transaction.getBigDecimalAmount();
                                        return amount != null && amount.compareTo(BigDecimal.ZERO) > 0;
                                })

                                .filter(transaction -> entryClassifier.classify(transaction,
                                                buildDescription(transaction)) == CreditCardOfxEntryType.PAYMENT)
                                .sorted(Comparator.comparing(
                                                Transaction::getDatePosted,
                                                Comparator.nullsLast(Comparator.naturalOrder())))
                                .toList();

                for (Transaction payment : payments) {

                        /*
                         * Valores de até dois centavos são mantidos
                         * como saldo anterior remanescente, mas não
                         * fazem o próximo pagamento ser considerado
                         * parte da fatura anterior.
                         */
                        if (remainingPreviousBalance.compareTo(
                                        MONEY_TOLERANCE) <= 0) {

                                break;
                        }

                        BigDecimal paymentAmount = payment.getBigDecimalAmount();

                        String externalId = normalizeExternalId(payment);

                        if (paymentAmount == null
                                        || paymentAmount.compareTo(
                                                        BigDecimal.ZERO) == 0
                                        || externalId == null
                                        || externalId.isBlank()) {

                                continue;
                        }

                        paymentAmount = paymentAmount.abs();

                        BigDecimal maximumPreviousPayment = remainingPreviousBalance.add(
                                        MONEY_TOLERANCE);

                        if (paymentAmount.compareTo(
                                        maximumPreviousPayment) <= 0) {

                                previousStatementPayments.add(
                                                externalId);

                                remainingPreviousBalance = remainingPreviousBalance
                                                .subtract(paymentAmount)
                                                .max(BigDecimal.ZERO);

                                continue;
                        }

                        /*
                         * Um único pagamento maior que o saldo
                         * anterior pode ter quitado duas faturas.
                         *
                         * Não fazemos divisão automática.
                         */
                        reviewRequiredPayments.add(
                                        externalId);

                        remainingPreviousBalance = BigDecimal.ZERO;

                        break;
                }

                return new PaymentPeriodAnalysis(

                                previousStatementPayments,

                                reviewRequiredPayments,

                                remainingPreviousBalance
                                                .setScale(
                                                                2,
                                                                RoundingMode.HALF_UP),

                                true);
        }

        private record PaymentPeriodAnalysis(

                        Set<String> previousStatementPaymentExternalIds,

                        Set<String> reviewRequiredPaymentExternalIds,

                        BigDecimal previousBalanceAmount,

                        boolean reliable) {

                private static PaymentPeriodAnalysis unavailable() {

                        return new PaymentPeriodAnalysis(
                                        Set.of(),
                                        Set.of(),
                                        BigDecimal.ZERO,
                                        false);
                }

                private boolean belongsToPreviousStatement(
                                String externalId) {

                        return previousStatementPaymentExternalIds
                                        .contains(externalId);
                }

                private boolean requiresReview(
                                String externalId) {

                        return reviewRequiredPaymentExternalIds
                                        .contains(externalId);
                }
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

                financialTransaction.setStatus(FinancialTransactionStatus.SETTLED);

                financialTransaction.setPurchaseDate(purchaseDate);
                financialTransaction.setDueDate(creditCardStatement.getDueDate());
                financialTransaction.setSettlementDate(purchaseDate);

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

                BigDecimal amount = requireAmount(ofxTransaction).abs();

                LocalDate purchaseDate = requirePostedDate(ofxTransaction);

                transaction.setAccount(creditCardAccount);

                transaction.setCreditCardStatement(statement);

                transaction.setType(FinancialTransactionType.EXPENSE);

                transaction.setSource(FinancialTransactionSource.CREDIT_CARD);

                transaction.setStatus(FinancialTransactionStatus.SETTLED);

                transaction.setTransferDirection(null);

                transaction.setTransferGroupId(null);

                transaction.setTransferCounterpartyAccount(null);

                transaction.setPurchaseDate(purchaseDate);

                transaction.setDueDate(statement.getDueDate());

                transaction.setSettlementDate(purchaseDate);

                transaction.setExpectedAmount(amount);

                transaction.setSettledAmount(amount);

                transaction.setInterestAmount(BigDecimal.ZERO);

                transaction.setDiscountAmount(BigDecimal.ZERO);

                transaction.setRawDescription(buildDescription(ofxTransaction));

                transaction.setImportedAt(LocalDateTime.now());

                transaction.setDocumentNumber(ofxTransaction.getCheckNumber());
        }
}
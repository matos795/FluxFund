package com.fluxfund.api.domain.creditcardstatement.service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.fluxfund.api.domain.account.Account;
import com.fluxfund.api.domain.account.AccountType;
import com.fluxfund.api.domain.account.mapper.AccountMapper;
import com.fluxfund.api.domain.account.repository.AccountRepository;
import com.fluxfund.api.domain.category.Category;
import com.fluxfund.api.domain.category.CategoryType;
import com.fluxfund.api.domain.category.repository.CategoryRepository;
import com.fluxfund.api.domain.creditcardstatement.CreditCardStatement;
import com.fluxfund.api.domain.creditcardstatement.CreditCardStatementPayment;
import com.fluxfund.api.domain.creditcardstatement.CreditCardStatementPaymentStatus;
import com.fluxfund.api.domain.creditcardstatement.CreditCardStatementStatus;
import com.fluxfund.api.domain.creditcardstatement.dto.CreateCreditCardItemRequest;
import com.fluxfund.api.domain.creditcardstatement.dto.CreateCreditCardStatementRequest;
import com.fluxfund.api.domain.creditcardstatement.dto.CreditCardStatementPaymentResponse;
import com.fluxfund.api.domain.creditcardstatement.dto.CreditCardStatementResponse;
import com.fluxfund.api.domain.creditcardstatement.dto.PayCreditCardStatementRequest;
import com.fluxfund.api.domain.creditcardstatement.dto.UpdateCreditCardStatementRequest;
import com.fluxfund.api.domain.creditcardstatement.mapper.CreditCardStatementMapper;
import com.fluxfund.api.domain.creditcardstatement.repository.CreditCardStatementPaymentRepository;
import com.fluxfund.api.domain.creditcardstatement.repository.CreditCardStatementRepository;
import com.fluxfund.api.domain.financialtransaction.FinancialTransaction;
import com.fluxfund.api.domain.financialtransaction.FinancialTransactionSource;
import com.fluxfund.api.domain.financialtransaction.FinancialTransactionStatus;
import com.fluxfund.api.domain.financialtransaction.FinancialTransactionType;
import com.fluxfund.api.domain.financialtransaction.FiscalDocumentPolicy;
import com.fluxfund.api.domain.financialtransaction.TransferDirection;
import com.fluxfund.api.domain.financialtransaction.dto.FinancialTransactionResponse;
import com.fluxfund.api.domain.financialtransaction.mapper.FinancialTransactionMapper;
import com.fluxfund.api.domain.financialtransaction.repository.FinancialTransactionRepository;
import com.fluxfund.api.domain.financialtransaction.service.FinancialTransactionDocumentPolicyService;
import com.fluxfund.api.domain.financialtransaction.service.FinancialTransactionService;
import com.fluxfund.api.domain.organization.Organization;
import com.fluxfund.api.domain.organization.repository.OrganizationRepository;
import com.fluxfund.api.security.OrganizationAccessService;
import com.fluxfund.api.shared.exception.BusinessException;
import com.fluxfund.api.shared.exception.ResourceNotFoundException;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class CreditCardStatementService {

    private final CreditCardStatementRepository statementRepository;
    private final FinancialTransactionRepository financialTransactionRepository;
    private final FinancialTransactionService financialTransactionService;
    private final OrganizationRepository organizationRepository;
    private final AccountRepository accountRepository;
    private final CategoryRepository categoryRepository;
    private final OrganizationAccessService organizationAccessService;
    private final FinancialTransactionDocumentPolicyService documentPolicyService;
    private final CreditCardStatementPaymentRepository paymentRepository;

    public CreditCardStatementResponse create(UUID organizationId, CreateCreditCardStatementRequest request) {

        organizationAccessService.requireFinanceWriteAccess(organizationId);

        Organization organization = organizationRepository.findById(organizationId)
                .orElseThrow(() -> new ResourceNotFoundException("Organization not found"));

        Account creditCardAccount = accountRepository
                .findByIdAndOrganizationIdAndActiveTrue(request.creditCardAccountId(), organizationId)
                .orElseThrow(() -> new ResourceNotFoundException("Credit card account not found"));

        validateCreditCardAccount(creditCardAccount);

        CreditCardStatement statement = new CreditCardStatement();
        statement.setOrganization(organization);
        statement.setCreditCardAccount(creditCardAccount);
        statement.setName(request.name());
        statement.setClosingDate(request.closingDate());
        statement.setDueDate(request.dueDate());
        statement.setStatus(CreditCardStatementStatus.OPEN);

        CreditCardStatement savedStatement = statementRepository.save(statement);

        return toResponse(organizationId, savedStatement);
    }

    @Transactional(readOnly = true)
    public Page<CreditCardStatementResponse> findAll(
            UUID organizationId,
            UUID creditCardAccountId,
            CreditCardStatementStatus status,
            Pageable pageable) {

        organizationAccessService.requireReadAccess(organizationId);

        Page<CreditCardStatement> statements;

        if (creditCardAccountId != null && status != null) {
            statements = statementRepository.findAllByOrganizationIdAndCreditCardAccountIdAndStatus(
                    organizationId,
                    creditCardAccountId,
                    status,
                    pageable);
        } else if (creditCardAccountId != null) {
            statements = statementRepository.findAllByOrganizationIdAndCreditCardAccountId(
                    organizationId,
                    creditCardAccountId,
                    pageable);
        } else if (status != null) {
            statements = statementRepository.findAllByOrganizationIdAndStatus(
                    organizationId,
                    status,
                    pageable);
        } else {
            statements = statementRepository.findAllByOrganizationId(organizationId, pageable);
        }

        return statements.map(statement -> toResponse(organizationId, statement));
    }

    @Transactional(readOnly = true)
    public CreditCardStatementResponse findById(UUID organizationId, UUID id) {
        organizationAccessService.requireReadAccess(organizationId);

        CreditCardStatement statement = findStatement(organizationId, id);

        return toResponse(organizationId, statement);
    }

    public CreditCardStatementResponse update(
            UUID organizationId,
            UUID id,
            UpdateCreditCardStatementRequest request) {

        organizationAccessService.requireFinanceWriteAccess(organizationId);

        CreditCardStatement statement = findStatement(organizationId, id);

        if (statement.getStatus() == CreditCardStatementStatus.PAID) {
            throw new BusinessException("Paid credit card statements cannot be edited");
        }

        if (request.name() != null) {
            statement.setName(request.name());
        }

        if (request.closingDate() != null) {
            statement.setClosingDate(request.closingDate());
        }

        if (request.dueDate() != null) {
            statement.setDueDate(request.dueDate());
        }

        CreditCardStatement savedStatement = statementRepository.save(statement);

        return toResponse(organizationId, savedStatement);
    }

    public FinancialTransactionResponse addItem(
            UUID organizationId,
            UUID statementId,
            CreateCreditCardItemRequest request) {

        organizationAccessService.requireFinanceWriteAccess(organizationId);

        CreditCardStatement statement = findStatement(organizationId, statementId);

        if (statement.getStatus() == CreditCardStatementStatus.PAID
                || statement.getStatus() == CreditCardStatementStatus.CANCELED) {
            throw new BusinessException("Cannot add items to paid or canceled statements");
        }

        Category category = categoryRepository
                .findByIdAndOrganizationIdAndActiveTrue(request.categoryId(), organizationId)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found"));

        if (category.getType() != CategoryType.EXPENSE) {
            throw new BusinessException("Credit card item category must be an expense category");
        }

        FinancialTransaction transaction = FinancialTransaction.builder()
                .organization(statement.getOrganization())
                .account(statement.getPaymentAccount() != null
                        ? statement.getPaymentAccount()
                        : statement.getCreditCardAccount())
                .creditCardStatement(statement)
                .type(FinancialTransactionType.EXPENSE)
                .source(FinancialTransactionSource.CREDIT_CARD)
                .status(FinancialTransactionStatus.PENDING)
                .category(category)
                .purchaseDate(request.purchaseDate())
                .dueDate(statement.getDueDate())
                .settlementDate(null)
                .expectedAmount(request.amount())
                .settledAmount(null)
                .interestAmount(BigDecimal.ZERO)
                .discountAmount(BigDecimal.ZERO)
                .description(request.description())
                .rawDescription(request.description())
                .documentNumber(request.documentNumber())
                .fiscalDocumentPolicy(
                        request.fiscalDocumentPolicy() != null
                                ? request.fiscalDocumentPolicy()
                                : FiscalDocumentPolicy.CATEGORY)
                .fiscalDocumentNote(request.fiscalDocumentNote())
                .installmentNumber(request.installmentNumber())
                .installmentCount(request.installmentCount())
                .build();

        documentPolicyService.normalizeAndValidate(transaction);

        FinancialTransaction savedTransaction = financialTransactionRepository.save(transaction);

        if (request.allocations() != null && !request.allocations().isEmpty()) {
            for (var allocation : request.allocations()) {
                financialTransactionService.addAllocation(
                        organizationId,
                        savedTransaction.getId(),
                        allocation);
            }
        }

        FinancialTransaction reloadedTransaction = financialTransactionRepository
                .findByIdAndOrganizationId(savedTransaction.getId(), organizationId)
                .orElseThrow(() -> new ResourceNotFoundException("Financial transaction not found"));

        return FinancialTransactionMapper.toResponse(reloadedTransaction);
    }

    public CreditCardStatementResponse pay(
            UUID organizationId,
            UUID statementId,
            PayCreditCardStatementRequest request) {

        organizationAccessService
                .requireFinanceWriteAccess(
                        organizationId);

        CreditCardStatement statement = findStatement(
                organizationId,
                statementId);

        if (statement.getStatus() == CreditCardStatementStatus.PAID) {

            throw new BusinessException(
                    "Credit card statement is already paid");
        }

        if (statement.getStatus() == CreditCardStatementStatus.CANCELED) {

            throw new BusinessException(
                    "Canceled credit card statements cannot receive payments");
        }

        BigDecimal totalAmount = financialTransactionRepository
                .sumCreditCardStatementTotal(
                        organizationId,
                        statementId);

        if (totalAmount.compareTo(
                BigDecimal.ZERO) <= 0) {

            throw new BusinessException(
                    "Credit card statement has no amount to pay");
        }

        BigDecimal paidBefore = paymentRepository
                .sumAmountByStatement(
                        organizationId,
                        statementId);

        BigDecimal outstandingBefore = totalAmount.subtract(
                paidBefore);

        BigDecimal paymentAmount = request.amount();

        if (paymentAmount.compareTo(
                outstandingBefore) > 0) {

            throw new BusinessException(
                    "Payment amount cannot be greater than the outstanding amount");
        }

        Account paymentAccount = accountRepository
                .findByIdAndOrganizationIdAndActiveTrue(
                        request.paymentAccountId(),
                        organizationId)

                .orElseThrow(
                        () -> new ResourceNotFoundException(
                                "Payment account not found"));

        if (paymentAccount.getType() == AccountType.CREDIT_CARD) {

            throw new BusinessException(
                    "Payment account cannot be a credit card");
        }

        FinancialTransaction paymentTransaction = resolvePaymentTransaction(

                organizationId,

                statement,

                paymentAccount,

                request);

        CreditCardStatementPayment payment = new CreditCardStatementPayment();

        payment.setOrganization(
                statement.getOrganization());

        payment.setStatement(
                statement);

        payment.setPaymentAccount(
                paymentAccount);

        payment.setPaymentTransaction(
                paymentTransaction);

        payment.setPaymentDate(
                request.paymentDate());

        payment.setAmount(
                paymentAmount);

        paymentRepository.save(
                payment);

        BigDecimal paidAfter = paidBefore.add(
                paymentAmount);

        boolean currentBalanceFullyPaid =

                paidAfter.compareTo(
                        totalAmount) >= 0;

        if (currentBalanceFullyPaid) {

            settleStatementItems(

                    organizationId,

                    statement,

                    request.paymentDate());
        }

        if (statement.getStatus() == CreditCardStatementStatus.CLOSED

                && currentBalanceFullyPaid) {

            statement.setStatus(
                    CreditCardStatementStatus.PAID);

            statement.setPaymentAccount(
                    paymentAccount);

            statement.setPaymentDate(
                    request.paymentDate());

            statement.setPaymentTransaction(
                    paymentTransaction);
        }

        CreditCardStatement savedStatement = statementRepository.save(
                statement);

        return toResponse(
                organizationId,
                savedStatement);
    }

    public void cancel(UUID organizationId, UUID id) {
        organizationAccessService.requireFinanceWriteAccess(organizationId);

        CreditCardStatement statement = findStatement(organizationId, id);

        if (statement.getStatus() == CreditCardStatementStatus.PAID) {
            throw new BusinessException("Paid credit card statements cannot be canceled");
        }

        long paymentCount = paymentRepository.countByOrganizationIdAndStatementId(organizationId, id);

        if (paymentCount > 0) {
            throw new BusinessException("Credit card statements with payments cannot be canceled");
        }

        statement.setStatus(CreditCardStatementStatus.CANCELED);

        List<FinancialTransaction> items = financialTransactionRepository
                .findAllByCreditCardStatementIdAndOrganizationId(id, organizationId);

        for (FinancialTransaction item : items) {
            item.setStatus(FinancialTransactionStatus.CANCELED);
        }

        financialTransactionRepository.saveAll(items);
        statementRepository.save(statement);
    }

    @Transactional(readOnly = true)
    public List<CreditCardStatementPaymentResponse> findPayments(

            UUID organizationId,

            UUID statementId) {

        organizationAccessService
                .requireReadAccess(
                        organizationId);

        findStatement(
                organizationId,
                statementId);

        return paymentRepository

                .findAllByOrganizationIdAndStatementIdOrderByPaymentDateAscCreatedAtAsc(

                        organizationId,

                        statementId)

                .stream()

                .map(payment ->

                new CreditCardStatementPaymentResponse(

                        payment.getId(),

                        AccountMapper.toSummaryResponse(

                                payment
                                        .getPaymentAccount()),

                        payment
                                .getPaymentTransaction()
                                .getId(),

                        payment
                                .getPaymentDate(),

                        payment
                                .getAmount(),

                        payment
                                .getCreatedAt()))

                .toList();
    }

    private CreditCardStatement findStatement(UUID organizationId, UUID id) {
        return statementRepository.findByIdAndOrganizationId(id, organizationId)
                .orElseThrow(() -> new ResourceNotFoundException("Credit card statement not found"));
    }

    private void validateCreditCardAccount(Account account) {
        if (account.getType() != AccountType.CREDIT_CARD) {
            throw new BusinessException("Account must be a credit card account");
        }
    }

    private CreditCardStatementResponse toResponse(

            UUID organizationId,

            CreditCardStatement statement) {

        BigDecimal totalAmount =

                financialTransactionRepository

                        .sumCreditCardStatementTotal(

                                organizationId,

                                statement.getId());

        long itemCount =

                financialTransactionRepository

                        .countCreditCardStatementItems(

                                organizationId,

                                statement.getId());

        BigDecimal paidAmount =

                paymentRepository

                        .sumAmountByStatement(

                                organizationId,

                                statement.getId());

        long paymentCount =

                paymentRepository

                        .countByOrganizationIdAndStatementId(

                                organizationId,

                                statement.getId());

        java.time.LocalDate lastPaymentDate =

                paymentRepository

                        .findFirstByOrganizationIdAndStatementIdOrderByPaymentDateDescCreatedAtDesc(

                                organizationId,

                                statement.getId())

                        .map(
                                CreditCardStatementPayment::getPaymentDate)

                        .orElse(
                                null);

        /*
         * Compatibilidade com faturas antigas.
         *
         * As faturas pagas antes da criação da
         * tabela de pagamentos não possuem registros
         * em credit_card_statement_payment.
         */
        if (paymentCount == 0

                && statement.getStatus() == CreditCardStatementStatus.PAID) {

            paidAmount = totalAmount;

            paymentCount = 1;

            lastPaymentDate = statement.getPaymentDate();
        }

        BigDecimal outstandingAmount = totalAmount
                .subtract(paidAmount)
                .max(BigDecimal.ZERO);

        CreditCardStatementPaymentStatus paymentStatus = resolvePaymentStatus(totalAmount, paidAmount);

        return CreditCardStatementMapper
                .toResponse(statement,
                        paymentStatus,
                        totalAmount,
                        paidAmount,
                        outstandingAmount,
                        itemCount,
                        paymentCount,
                        lastPaymentDate);
    }

    @Transactional(readOnly = true)
    public List<FinancialTransactionResponse> findItems(
            UUID organizationId,
            UUID statementId) {

        organizationAccessService.requireReadAccess(organizationId);

        findStatement(organizationId, statementId);

        return financialTransactionRepository
                .findCreditCardStatementItems(organizationId, statementId)
                .stream()
                .map(FinancialTransactionMapper::toResponse)
                .toList();
    }

    private FinancialTransaction resolvePaymentTransaction(

            UUID organizationId,

            CreditCardStatement statement,

            Account paymentAccount,

            PayCreditCardStatementRequest request) {

        if (request.paymentTransactionId() == null) {

            return createManualPaymentTransaction(

                    statement,

                    paymentAccount,

                    request.paymentDate(),

                    request.amount());
        }

        if (paymentRepository
                .existsByOrganizationIdAndPaymentTransactionId(

                        organizationId,

                        request.paymentTransactionId())) {

            throw new BusinessException(
                    "Payment transaction is already linked to another payment");
        }

        FinancialTransaction transaction = financialTransactionRepository

                .findByIdAndOrganizationId(

                        request.paymentTransactionId(),

                        organizationId)

                .orElseThrow(

                        () -> new ResourceNotFoundException(

                                "Payment transaction not found"));

        if (!transaction
                .getAccount()
                .getId()
                .equals(
                        paymentAccount.getId())) {

            throw new BusinessException(
                    "Payment transaction belongs to another account");
        }

        if (transaction.getStatus() != FinancialTransactionStatus.SETTLED) {

            throw new BusinessException(
                    "Payment transaction must be settled");
        }

        BigDecimal transactionAmount =

                transaction.getSettledAmount() != null

                        ? transaction
                                .getSettledAmount()
                                .abs()

                        : transaction
                                .getExpectedAmount()
                                .abs();

        if (transactionAmount.compareTo(
                request.amount()) != 0) {

            throw new BusinessException(
                    "Payment amount must match the selected transaction amount");
        }

        if (transaction.getCategory() != null

                || !transaction
                        .getAllocations()
                        .isEmpty()) {

            throw new BusinessException(
                    "Payment transaction must be unclassified before linking");
        }

        transaction.setType(
                FinancialTransactionType.TRANSFER);

        transaction.setCategory(
                null);

        transaction.setTransferDirection(
                TransferDirection.OUT);

        transaction.setTransferCounterpartyAccount(
                statement.getCreditCardAccount());

        if (transaction.getTransferGroupId() == null) {

            transaction.setTransferGroupId(
                    UUID.randomUUID());
        }

        transaction.setDescription(

                "Pagamento da fatura "
                        + statement.getName());

        transaction.setDocumentNumber(
                null);

        transaction.setClassifiedAt(
                LocalDateTime.now());

        return financialTransactionRepository
                .save(transaction);
    }

    private FinancialTransaction createManualPaymentTransaction(

            CreditCardStatement statement,

            Account paymentAccount,

            java.time.LocalDate paymentDate,

            BigDecimal amount) {

        String description =

                "Pagamento da fatura "
                        + statement.getName();

        FinancialTransaction transaction = new FinancialTransaction();

        transaction.setOrganization(
                statement.getOrganization());

        transaction.setAccount(
                paymentAccount);

        transaction.setCategory(
                null);

        transaction.setType(
                FinancialTransactionType.TRANSFER);

        transaction.setSource(
                FinancialTransactionSource.MANUAL);

        transaction.setStatus(
                FinancialTransactionStatus.SETTLED);

        transaction.setDueDate(
                paymentDate);

        transaction.setSettlementDate(
                paymentDate);

        transaction.setExpectedAmount(
                amount);

        transaction.setSettledAmount(
                amount);

        transaction.setInterestAmount(
                BigDecimal.ZERO);

        transaction.setDiscountAmount(
                BigDecimal.ZERO);

        transaction.setDescription(
                description);

        transaction.setRawDescription(
                description);

        transaction.setTransferDirection(
                TransferDirection.OUT);

        transaction.setTransferCounterpartyAccount(
                statement.getCreditCardAccount());

        transaction.setTransferGroupId(
                UUID.randomUUID());

        transaction.setClassifiedAt(
                LocalDateTime.now());

        return financialTransactionRepository
                .save(transaction);
    }

    private void settleStatementItems(

            UUID organizationId,

            CreditCardStatement statement,

            java.time.LocalDate paymentDate) {

        List<FinancialTransaction> items =

                financialTransactionRepository

                        .findAllByCreditCardStatementIdAndOrganizationId(

                                statement.getId(),

                                organizationId);

        for (FinancialTransaction item : items) {

            if (item.getStatus() == FinancialTransactionStatus.CANCELED) {

                continue;
            }

            if (item.getStatus() == FinancialTransactionStatus.SETTLED) {

                continue;
            }

            item.setAccount(

                    statement.getCreditCardAccount());

            item.setSettlementDate(

                    paymentDate);

            item.setSettledAmount(

                    item.getExpectedAmount());

            item.setStatus(

                    FinancialTransactionStatus.SETTLED);
        }

        financialTransactionRepository
                .saveAll(items);
    }

    private CreditCardStatementPaymentStatus resolvePaymentStatus(
            BigDecimal totalAmount,
            BigDecimal paidAmount) {

        if (paidAmount == null

                || paidAmount.compareTo(
                        BigDecimal.ZERO) <= 0) {

            return CreditCardStatementPaymentStatus.UNPAID;
        }

        if (paidAmount.compareTo(
                totalAmount) >= 0) {

            return CreditCardStatementPaymentStatus.PAID;
        }

        return CreditCardStatementPaymentStatus.PARTIALLY_PAID;
    }
}
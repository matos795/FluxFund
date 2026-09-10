package com.fluxfund.api.domain.creditcardstatement.service;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.fluxfund.api.domain.creditcardstatement.CreditCardStatement;
import com.fluxfund.api.domain.creditcardstatement.CreditCardStatementPayment;
import com.fluxfund.api.domain.creditcardstatement.CreditCardStatementStatus;
import com.fluxfund.api.domain.creditcardstatement.repository.CreditCardStatementPaymentRepository;
import com.fluxfund.api.domain.creditcardstatement.repository.CreditCardStatementRepository;
import com.fluxfund.api.domain.financialtransaction.repository.FinancialTransactionRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class CreditCardStatementCreditService {

    private final CreditCardStatementRepository statementRepository;
    private final FinancialTransactionRepository financialTransactionRepository;
    private final CreditCardStatementPaymentRepository paymentRepository;

    public BigDecimal calculateStatementTotal(
            UUID organizationId,
            CreditCardStatement statement) {

        BigDecimal grossAmount = calculateStatementGrossAmount(
                organizationId,
                statement);

        BigDecimal previousCredit = statement.getPreviousCreditAmount() != null
                ? statement.getPreviousCreditAmount()
                : BigDecimal.ZERO;

        return grossAmount
                .subtract(previousCredit)
                .max(BigDecimal.ZERO);
    }

    public void applyPreviousAvailableCredit(
            UUID organizationId,
            CreditCardStatement statement) {

        statementRepository
                .findFirstByOrganizationIdAndCreditCardAccountIdAndDueDateBeforeAndStatusNotOrderByDueDateDesc(
                        organizationId,
                        statement.getCreditCardAccount().getId(),
                        statement.getDueDate(),
                        CreditCardStatementStatus.CANCELED)
                .ifPresent(previousStatement -> {

                    BigDecimal availableCredit = calculateAvailableCredit(
                            organizationId,
                            previousStatement);

                    statement.setPreviousCreditAmount(
                            availableCredit);
                });
    }

    public void recalculateFutureStatementCredits(
            UUID organizationId,
            CreditCardStatement currentStatement) {

        BigDecimal availableCredit = calculateAvailableCredit(
                organizationId,
                currentStatement);

        recalculateFutureStatementCredits(
                organizationId,
                currentStatement,
                availableCredit);
    }

    public void recalculateFutureStatementCredits(
            UUID organizationId,
            CreditCardStatement currentStatement,
            BigDecimal availableCredit) {

        List<CreditCardStatement> futureStatements = statementRepository
                .findAllByOrganizationIdAndCreditCardAccountIdAndDueDateAfterAndStatusNotOrderByDueDateAsc(
                        organizationId,
                        currentStatement
                                .getCreditCardAccount()
                                .getId(),
                        currentStatement.getDueDate(),
                        CreditCardStatementStatus.CANCELED);

        for (CreditCardStatement futureStatement : futureStatements) {

            futureStatement.setPreviousCreditAmount(availableCredit);

            statementRepository.save(futureStatement);

            recalculatePaymentBreakdown(organizationId, futureStatement);

            availableCredit = calculateAvailableCredit(organizationId, futureStatement);
        }
    }

    public void recalculateCreditState(
            UUID organizationId,
            CreditCardStatement statement) {

        recalculatePaymentBreakdown(
                organizationId,
                statement);

        recalculateFutureStatementCredits(
                organizationId,
                statement);
    }

    public void recalculateEntireChain(
            UUID organizationId,
            UUID creditCardAccountId) {

        List<CreditCardStatement> statements = statementRepository
                .findAllByOrganizationIdAndCreditCardAccountIdAndStatusNotOrderByDueDateAsc(
                        organizationId,
                        creditCardAccountId,
                        CreditCardStatementStatus.CANCELED);

        BigDecimal availableCredit = BigDecimal.ZERO;

        for (CreditCardStatement statement : statements) {

            statement.setPreviousCreditAmount(availableCredit);

            statementRepository.save(statement);

            recalculatePaymentBreakdown(organizationId, statement);

            availableCredit = calculateAvailableCredit(organizationId, statement);
        }
    }

    private BigDecimal calculateStatementGrossAmount(
            UUID organizationId,
            CreditCardStatement statement) {

        BigDecimal itemTotal = financialTransactionRepository
                .sumCreditCardStatementTotal(
                        organizationId,
                        statement.getId());

        BigDecimal previousBalance = statement.getPreviousBalanceAmount() != null
                ? statement.getPreviousBalanceAmount()
                : BigDecimal.ZERO;

        return itemTotal.add(
                previousBalance);
    }

    private BigDecimal calculateAvailableCredit(
            UUID organizationId,
            CreditCardStatement statement) {

        BigDecimal grossAmount = calculateStatementGrossAmount(
                organizationId,
                statement);

        BigDecimal previousCredit = statement.getPreviousCreditAmount() != null
                ? statement.getPreviousCreditAmount()
                : BigDecimal.ZERO;

        BigDecimal paidAmount = paymentRepository
                .sumAmountByStatement(
                        organizationId,
                        statement.getId());

        return previousCredit
                .add(paidAmount)
                .subtract(grossAmount)
                .max(BigDecimal.ZERO);
    }

    private void recalculatePaymentBreakdown(
            UUID organizationId,
            CreditCardStatement statement) {

        BigDecimal remainingOutstanding = calculateStatementTotal(
                organizationId,
                statement);

        List<CreditCardStatementPayment> payments = paymentRepository
                .findAllByOrganizationIdAndStatementIdOrderByPaymentDateAscCreatedAtAsc(
                        organizationId,
                        statement.getId());

        for (CreditCardStatementPayment payment : payments) {

            BigDecimal amount = payment.getAmount();

            BigDecimal appliedAmount = amount.min(
                    remainingOutstanding);

            BigDecimal advanceCreditAmount = amount.subtract(
                    appliedAmount);

            payment.setAppliedAmount(
                    appliedAmount);

            payment.setAdvanceCreditAmount(
                    advanceCreditAmount);

            remainingOutstanding = remainingOutstanding
                    .subtract(appliedAmount)
                    .max(BigDecimal.ZERO);
        }

        paymentRepository.saveAll(
                payments);
    }
}
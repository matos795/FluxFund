package com.fluxfund.api.domain.creditcardstatement.repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.fluxfund.api.domain.creditcardstatement.CreditCardStatementPayment;

public interface CreditCardStatementPaymentRepository
                extends JpaRepository<CreditCardStatementPayment, UUID> {

        @Query("""
                        select coalesce(sum(payment.amount), 0)
                        from CreditCardStatementPayment payment
                        where payment.organization.id = :organizationId
                          and payment.statement.id = :statementId
                        """)
        BigDecimal sumAmountByStatement(
                        @Param("organizationId") UUID organizationId,

                        @Param("statementId") UUID statementId);

        long countByOrganizationIdAndStatementId(
                        UUID organizationId,
                        UUID statementId);

        List<CreditCardStatementPayment> findAllByOrganizationIdAndStatementIdOrderByPaymentDateAscCreatedAtAsc(
                        UUID organizationId,
                        UUID statementId);

        Optional<CreditCardStatementPayment> findFirstByOrganizationIdAndStatementIdOrderByPaymentDateDescCreatedAtDesc(
                        UUID organizationId,
                        UUID statementId);

        boolean existsByOrganizationIdAndPaymentTransactionId(
                        UUID organizationId,
                        UUID paymentTransactionId);

        boolean existsByOrganizationIdAndStatementIdAndStatementExternalId(
                        UUID organizationId,
                        UUID statementId,
                        String statementExternalId);

        Optional<CreditCardStatementPayment> findByIdAndOrganizationIdAndStatementId(
                        UUID id,
                        UUID organizationId,
                        UUID statementId);

        long countByOrganizationIdAndStatementIdAndPaymentTransactionIsNull(
                        UUID organizationId,
                        UUID statementId);

        long countByOrganizationIdAndStatementIdAndPaymentTransactionIsNullAndOpeningBalanceFalse(
                        UUID organizationId,
                        UUID statementId);

        @Query("""
                        select payment
                        from CreditCardStatementPayment payment
                        where payment.organization.id = :organizationId
                          and payment.statement.id = :statementId
                          and payment.statementExternalId is null
                          and payment.amount = :amount
                          and payment.paymentDate between :startDate and :endDate
                        order by payment.createdAt asc
                        """)
        List<CreditCardStatementPayment> findPossibleStatementMatches(
                        @Param("organizationId") UUID organizationId,
                        @Param("statementId") UUID statementId,
                        @Param("amount") BigDecimal amount,
                        @Param("startDate") LocalDate startDate,
                        @Param("endDate") LocalDate endDate);

        long countByOrganizationIdAndStatementIdAndPaymentTransactionIsNotNull(
                        UUID organizationId,
                        UUID statementId);

        void deleteAllByOrganizationIdAndStatementIdAndPaymentTransactionIsNull(
                        UUID organizationId,
                        UUID statementId);
}
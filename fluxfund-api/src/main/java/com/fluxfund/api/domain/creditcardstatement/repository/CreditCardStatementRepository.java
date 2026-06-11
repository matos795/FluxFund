package com.fluxfund.api.domain.creditcardstatement.repository;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import com.fluxfund.api.domain.creditcardstatement.CreditCardStatement;
import com.fluxfund.api.domain.creditcardstatement.CreditCardStatementStatus;

public interface CreditCardStatementRepository extends JpaRepository<CreditCardStatement, UUID> {

    Page<CreditCardStatement> findAllByOrganizationIdAndCreditCardAccountIdAndStatus(
            UUID organizationId,
            UUID creditCardAccountId,
            CreditCardStatementStatus status,
            Pageable pageable);

    Page<CreditCardStatement> findAllByOrganizationIdAndCreditCardAccountId(
            UUID organizationId,
            UUID creditCardAccountId,
            Pageable pageable);

    Page<CreditCardStatement> findAllByOrganizationIdAndStatus(
            UUID organizationId,
            CreditCardStatementStatus status,
            Pageable pageable);

    Page<CreditCardStatement> findAllByOrganizationId(
            UUID organizationId,
            Pageable pageable);

    Optional<CreditCardStatement> findByIdAndOrganizationId(
            UUID id,
            UUID organizationId);
}
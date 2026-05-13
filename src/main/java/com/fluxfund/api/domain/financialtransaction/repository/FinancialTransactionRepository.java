package com.fluxfund.api.domain.financialtransaction.repository;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import com.fluxfund.api.domain.financialtransaction.FinancialTransaction;

public interface FinancialTransactionRepository extends JpaRepository<FinancialTransaction, UUID> {

    Page<FinancialTransaction> findAllByOrganizationId(
            UUID organizationId,
            Pageable pageable);

    Optional<FinancialTransaction> findByIdAndOrganizationId(
            UUID id,
            UUID organizationId);
}

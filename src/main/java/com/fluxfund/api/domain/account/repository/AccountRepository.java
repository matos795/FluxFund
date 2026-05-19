package com.fluxfund.api.domain.account.repository;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.fluxfund.api.domain.account.Account;

public interface AccountRepository extends JpaRepository<Account, UUID> {

    Page<Account> findAllByOrganizationIdAndActiveTrue(
            UUID organizationId,
            Pageable pageable);

    Optional<Account> findByIdAndOrganizationIdAndActiveTrue(UUID accountId, UUID organizationId);

    @Query("""
            select coalesce(sum(a.initialBalance), 0)
            from Account a
            where a.organization.id = :organizationId
              and a.active = true
            """)
    BigDecimal sumInitialBalanceByOrganizationId(
            @Param("organizationId") UUID organizationId);
}
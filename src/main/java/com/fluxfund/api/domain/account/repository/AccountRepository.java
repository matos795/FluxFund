package com.fluxfund.api.domain.account.repository;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import com.fluxfund.api.domain.account.Account;


public interface AccountRepository extends JpaRepository<Account, UUID> {

    Page<Account> findAllByOrganizationIdAndActiveTrue(
            UUID organizationId,
            Pageable pageable
    );

    Optional<Account> findByIdAndOrganizationIdAndActiveTrue(UUID accountId, UUID organizationId);
}
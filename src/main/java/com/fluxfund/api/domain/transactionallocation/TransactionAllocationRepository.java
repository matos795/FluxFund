package com.fluxfund.api.domain.transactionallocation;

import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

public interface TransactionAllocationRepository extends JpaRepository<TransactionAllocation, UUID> {

}

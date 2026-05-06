package com.fluxfund.api.domain.banktransaction;

import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

public interface BankTransactionRepository extends JpaRepository<BankTransaction, UUID> {

}

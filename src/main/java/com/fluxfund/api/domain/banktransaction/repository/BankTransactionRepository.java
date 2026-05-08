package com.fluxfund.api.domain.banktransaction.repository;

import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.fluxfund.api.domain.banktransaction.BankTransaction;

public interface BankTransactionRepository extends JpaRepository<BankTransaction, UUID> {

}

package com.fluxfund.api.domain.account.mapper;

import org.springframework.stereotype.Component;

import com.fluxfund.api.domain.account.Account;
import com.fluxfund.api.domain.account.dto.AccountResponse;
import com.fluxfund.api.domain.account.dto.CreateAccountRequest;
import com.fluxfund.api.domain.account.dto.UpdateAccountRequest;
import com.fluxfund.api.domain.organization.Organization;

@Component
public class AccountMapper {

    public Account createEntity(CreateAccountRequest request, Organization organization) {

        return new Account(
            organization,
            request.bankCode(),
            request.bankName(),
            request.agency(),
            request.accountNumber(),
            request.name(),
            request.type(),
            request.initialBalance(),
            request.initialBalanceDate(),
            true
        );
    }

    public AccountResponse toResponse(Account account) {

        return new AccountResponse(
                account.getId(),
                account.getName(),
                account.getType(),
                account.getBankCode(),
                account.getBankName(),
                account.getAgency(),
                account.getAccountNumber(),
                account.getInitialBalance(),
                account.isActive(),
                account.getOrganization().getId(),
                account.getCreatedAt(),
                account.getUpdatedAt()
        );
    }

    public void updateEntity(Account account, UpdateAccountRequest request) {

        if (request.name() != null) {
            account.setName(request.name());
        }
        if (request.type() != null) {
            account.setType(request.type());
        }
        if (request.initialBalance() != null) {
            account.setInitialBalance(request.initialBalance());
        }
        if (request.bankCode() != null) {
            account.setBankCode(request.bankCode());
        }
        if (request.bankName() != null) {
            account.setBankName(request.bankName());
        }
        if (request.agency() != null) {
            account.setAgency(request.agency());
        }
        if (request.accountNumber() != null) {
            account.setAccountNumber(request.accountNumber());
        }
        if (request.initialBalanceDate() != null) {
            account.setInitialBalanceDate(request.initialBalanceDate());
        }
        if (request.active() != null) {
            account.setActive(request.active());
        }
    }
}
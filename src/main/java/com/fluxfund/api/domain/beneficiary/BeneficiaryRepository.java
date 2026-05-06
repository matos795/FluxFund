package com.fluxfund.api.domain.beneficiary;

import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

public interface BeneficiaryRepository extends JpaRepository<Beneficiary, UUID> {

}

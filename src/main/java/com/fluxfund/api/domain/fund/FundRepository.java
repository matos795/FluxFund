package com.fluxfund.api.domain.fund;

import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

public interface FundRepository extends JpaRepository<Fund, UUID> {

}

package com.fluxfund.api.domain.receipt.service;

import java.util.UUID;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import com.fluxfund.api.shared.exception.BusinessException;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ReceiptNumberService {

    private final JdbcTemplate jdbcTemplate;

    public long nextNumber(

            UUID organizationId,

            int sequenceYear) {

        Long nextNumber = jdbcTemplate.queryForObject(

                """
                        INSERT INTO receipt_counter (
                            organization_id,
                            sequence_year,
                            last_number
                        )

                        VALUES (
                            ?,
                            ?,
                            1
                        )

                        ON CONFLICT (
                            organization_id,
                            sequence_year
                        )

                        DO UPDATE SET
                            last_number =
                                receipt_counter.last_number + 1

                        RETURNING last_number
                        """,

                Long.class,

                organizationId,

                sequenceYear);

        if (nextNumber == null) {

            throw new BusinessException(
                    "Could not generate receipt number");
        }

        return nextNumber;
    }
}
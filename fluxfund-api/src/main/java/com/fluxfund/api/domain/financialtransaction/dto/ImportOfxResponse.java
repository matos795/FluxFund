package com.fluxfund.api.domain.financialtransaction.dto;

import java.util.List;
import java.util.UUID;

public record ImportOfxResponse(
                int imported,
                int ignoredDuplicates,
                int failed,
                List<String> errors,
                UUID importBatchId) {

        public ImportOfxResponse(
                        int imported,
                        int ignoredDuplicates,
                        int failed,
                        List<String> errors) {

                this(
                                imported,
                                ignoredDuplicates,
                                failed,
                                errors,
                                null);
        }
}
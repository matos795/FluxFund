package com.fluxfund.api.shared.exception;

public class RateLimitExceededException
        extends RuntimeException {

    private final long retryAfterSeconds;

    public RateLimitExceededException(
            long retryAfterSeconds) {

        super(
                "Muitas tentativas foram realizadas. "
                        + "Aguarde alguns minutos "
                        + "e tente novamente.");

        this.retryAfterSeconds =
                retryAfterSeconds;
    }

    public long getRetryAfterSeconds() {
        return retryAfterSeconds;
    }
}
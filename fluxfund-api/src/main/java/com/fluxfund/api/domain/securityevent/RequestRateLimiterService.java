package com.fluxfund.api.domain.securityevent;

import java.time.Duration;
import java.time.Instant;
import java.util.Iterator;
import java.util.LinkedHashMap;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.fluxfund.api.shared.exception.RateLimitExceededException;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class RequestRateLimiterService {

    /*
     * Impede crescimento ilimitado da memória
     * em caso de muitos IPs diferentes.
     */
    private static final int
            MAX_TRACKED_KEYS = 20_000;

    private final SecurityEventService
            securityEventService;

    /*
     * accessOrder=true mantém os IPs usados
     * recentemente no fim do mapa.
     */
    private final Map<
            String,
            RateLimitWindow> windows =

            new LinkedHashMap<>(
                    128,
                    0.75f,
                    true);

    @Value(
            "${app.security.rate-limit.login.max-requests:10}")
    private int loginMaxRequests;

    @Value(
            "${app.security.rate-limit.login.window:PT10M}")
    private Duration loginWindow;

    @Value(
            "${app.security.rate-limit.password-reset-request.max-requests:5}")
    private int passwordResetRequestMaxRequests;

    @Value(
            "${app.security.rate-limit.password-reset-request.window:PT30M}")
    private Duration passwordResetRequestWindow;

    @Value(
            "${app.security.rate-limit.password-reset-confirmation.max-requests:10}")
    private int passwordResetConfirmationMaxRequests;

    @Value(
            "${app.security.rate-limit.password-reset-confirmation.window:PT15M}")
    private Duration passwordResetConfirmationWindow;

    @Value(
            "${app.security.rate-limit.invitation-details.max-requests:30}")
    private int invitationDetailsMaxRequests;

    @Value(
            "${app.security.rate-limit.invitation-details.window:PT10M}")
    private Duration invitationDetailsWindow;

    @Value(
            "${app.security.rate-limit.invitation-accept.max-requests:10}")
    private int invitationAcceptMaxRequests;

    @Value(
            "${app.security.rate-limit.invitation-accept.window:PT15M}")
    private Duration invitationAcceptWindow;

    public void checkLogin(
            SecurityRequestMetadata metadata,
            String email) {

        check(
                "LOGIN",
                metadata,
                email,
                loginMaxRequests,
                loginWindow);
    }

    public void resetLogin(
            SecurityRequestMetadata metadata) {

        reset(
                "LOGIN",
                metadata);
    }

    public void checkPasswordResetRequest(
            SecurityRequestMetadata metadata,
            String email) {

        check(
                "PASSWORD_RESET_REQUEST",
                metadata,
                email,
                passwordResetRequestMaxRequests,
                passwordResetRequestWindow);
    }

    public void checkPasswordResetConfirmation(
            SecurityRequestMetadata metadata) {

        check(
                "PASSWORD_RESET_CONFIRMATION",
                metadata,
                null,
                passwordResetConfirmationMaxRequests,
                passwordResetConfirmationWindow);
    }

    public void checkInvitationDetails(
            SecurityRequestMetadata metadata) {

        check(
                "INVITATION_DETAILS",
                metadata,
                null,
                invitationDetailsMaxRequests,
                invitationDetailsWindow);
    }

    public void checkInvitationAcceptance(
            SecurityRequestMetadata metadata) {

        check(
                "INVITATION_ACCEPT",
                metadata,
                null,
                invitationAcceptMaxRequests,
                invitationAcceptWindow);
    }

    private synchronized void check(
            String scope,
            SecurityRequestMetadata metadata,
            String email,
            int maximumRequests,
            Duration windowDuration) {

        String key =
                buildKey(
                        scope,
                        metadata);

        /*
         * O endereço remoto normalmente sempre
         * existe, mas evitamos bloquear todos os
         * clientes sob uma chave "desconhecida".
         */
        if (key == null) {
            return;
        }

        if (maximumRequests <= 0
                || windowDuration == null
                || windowDuration.isZero()
                || windowDuration.isNegative()) {

            return;
        }

        Instant now =
                Instant.now();

        RateLimitWindow currentWindow =
                windows.get(key);

        if (currentWindow == null
                || !currentWindow
                        .expiresAt()
                        .isAfter(now)) {

            windows.put(
                    key,

                    new RateLimitWindow(
                            1,
                            now.plus(
                                    windowDuration)));

            trimOldestEntries();

            return;
        }

        if (currentWindow.requestCount()
                >= maximumRequests) {

            long retryAfterSeconds =
                    Math.max(
                            1,

                            Duration.between(
                                            now,

                                            currentWindow
                                                    .expiresAt())
                                    .toSeconds());

            securityEventService.record(
                    null,
                    email,

                    SecurityEventType
                            .RATE_LIMIT_BLOCK,

                    SecurityEventOutcome.FAILURE,

                    metadata,

                    "Request blocked by rate limit: "
                            + scope);

            throw new RateLimitExceededException(
                    retryAfterSeconds);
        }

        windows.put(
                key,

                new RateLimitWindow(
                        currentWindow
                                .requestCount()
                                + 1,

                        currentWindow
                                .expiresAt()));
    }

    private synchronized void reset(
            String scope,
            SecurityRequestMetadata metadata) {

        String key =
                buildKey(
                        scope,
                        metadata);

        if (key != null) {
            windows.remove(key);
        }
    }

    private String buildKey(
            String scope,
            SecurityRequestMetadata metadata) {

        if (metadata == null
                || metadata.ipAddress() == null
                || metadata
                        .ipAddress()
                        .isBlank()) {

            return null;
        }

        return scope
                + ":"
                + metadata
                        .ipAddress()
                        .trim();
    }

    private void trimOldestEntries() {

        if (windows.size()
                <= MAX_TRACKED_KEYS) {

            return;
        }

        Iterator<String> iterator =
                windows
                        .keySet()
                        .iterator();

        while (windows.size()
                > MAX_TRACKED_KEYS
                && iterator.hasNext()) {

            iterator.next();
            iterator.remove();
        }
    }

    private record RateLimitWindow(

            int requestCount,

            Instant expiresAt

    ) {
    }
}
package com.fluxfund.api.security;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.HexFormat;

import org.springframework.stereotype.Service;

@Service
public class InvitationTokenService {

    private static final int TOKEN_SIZE_BYTES = 32;

    private final SecureRandom secureRandom =
            new SecureRandom();

    public GeneratedInvitationToken generate() {

        byte[] bytes =
                new byte[TOKEN_SIZE_BYTES];

        secureRandom.nextBytes(bytes);

        String rawToken =
                Base64.getUrlEncoder()
                        .withoutPadding()
                        .encodeToString(bytes);

        return new GeneratedInvitationToken(
                rawToken,
                hash(rawToken));
    }

    public String hash(String rawToken) {

        if (rawToken == null
                || rawToken.isBlank()) {

            throw new IllegalArgumentException(
                    "Invitation token is required");
        }

        try {
            MessageDigest digest =
                    MessageDigest.getInstance(
                            "SHA-256");

            byte[] hash =
                    digest.digest(
                            rawToken.getBytes(
                                    StandardCharsets.UTF_8));

            return HexFormat.of()
                    .formatHex(hash);

        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException(
                    "SHA-256 is not available",
                    exception);
        }
    }

    public record GeneratedInvitationToken(
            String rawToken,
            String tokenHash
    ) {
    }
}
package com.fluxfund.api.shared.util;

public final class EmailNormalizer {

    private EmailNormalizer() {
    }

    public static String normalize(String email) {

        String normalized = StringNormalizer.normalize(email);

        if (normalized == null) {
            return null;
        }

        return normalized.toLowerCase();
    }

}
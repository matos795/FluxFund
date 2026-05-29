package com.fluxfund.api.shared.util;

public final class StringNormalizer {

    private StringNormalizer() {
    }

    public static String normalize(String value) {

        if (value == null) {
            return null;
        }

        String normalized = value.trim();

        return normalized.isBlank()
                ? null
                : normalized;
    }
}
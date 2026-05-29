package com.fluxfund.api.shared.util;

public final class PhoneNormalizer {

    private PhoneNormalizer() {
    }

    public static String normalize(String phone) {

        String normalized = StringNormalizer.normalize(phone);

        if (normalized == null) {
            return null;
        }

        return normalized.replaceAll("[^\\d+]", "");
    }
}
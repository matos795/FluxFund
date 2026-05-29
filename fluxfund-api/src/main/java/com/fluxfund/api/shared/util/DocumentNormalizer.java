package com.fluxfund.api.shared.util;

public final class DocumentNormalizer {

    private DocumentNormalizer() {
    }

    public static String normalize(String document) {

        String normalized = StringNormalizer.normalize(document);

        if (normalized == null) {
            return null;
        }

        return normalized.replaceAll("\\D", "");
    }
}

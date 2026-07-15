package com.fluxfund.api.shared.ofx;

import java.nio.ByteBuffer;
import java.nio.CharBuffer;
import java.nio.charset.CharacterCodingException;
import java.nio.charset.Charset;
import java.nio.charset.CodingErrorAction;
import java.nio.charset.StandardCharsets;
import java.util.List;

import org.springframework.stereotype.Component;

@Component
public class OfxTextNormalizer {

    private static final Charset WINDOWS_1252 =
            Charset.forName("windows-1252");

    private static final int MAX_REPAIR_ATTEMPTS = 2;

    public String normalize(String value) {

        if (value == null || value.isBlank()) {
            return value;
        }

        String currentValue = value;

        for (int attempt = 0;
             attempt < MAX_REPAIR_ATTEMPTS;
             attempt++) {

            String repairedValue = repairOnce(currentValue);

            if (repairedValue.equals(currentValue)) {
                break;
            }

            currentValue = repairedValue;
        }

        return currentValue;
    }

    private String repairOnce(String value) {

        int bestScore = calculateMojibakeScore(value);

        if (bestScore == 0) {
            return value;
        }

        String bestValue = value;

        List<Charset> sourceCharsets = List.of(
                WINDOWS_1252,
                StandardCharsets.ISO_8859_1);

        for (Charset sourceCharset : sourceCharsets) {

            String candidate = reinterpretAsUtf8(
                    value,
                    sourceCharset);

            if (candidate == null) {
                continue;
            }

            int candidateScore =
                    calculateMojibakeScore(candidate);

            if (candidateScore < bestScore) {
                bestValue = candidate;
                bestScore = candidateScore;
            }
        }

        return bestValue;
    }

    private String reinterpretAsUtf8(
            String value,
            Charset sourceCharset) {

        try {

            ByteBuffer encodedValue = sourceCharset
                    .newEncoder()
                    .onMalformedInput(
                            CodingErrorAction.REPORT)
                    .onUnmappableCharacter(
                            CodingErrorAction.REPORT)
                    .encode(CharBuffer.wrap(value));

            return StandardCharsets.UTF_8
                    .newDecoder()
                    .onMalformedInput(
                            CodingErrorAction.REPORT)
                    .onUnmappableCharacter(
                            CodingErrorAction.REPORT)
                    .decode(encodedValue)
                    .toString();

        } catch (CharacterCodingException exception) {

            return null;
        }
    }

    private int calculateMojibakeScore(String value) {

        int score = 0;

        for (int index = 0;
             index < value.length();
             index++) {

            char character = value.charAt(index);

            if (character == '\uFFFD') {
                score += 5;
            }

            if (character >= '\u0080'
                    && character <= '\u009F') {

                score += 3;
            }

            if (character == 'Ã'
                    || character == 'Â'
                    || character == 'â') {

                score++;
            }
        }

        return score;
    }
}
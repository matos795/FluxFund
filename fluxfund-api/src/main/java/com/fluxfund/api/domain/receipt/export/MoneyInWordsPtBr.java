package com.fluxfund.api.domain.receipt.export;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;

import com.fluxfund.api.shared.exception.BusinessException;

public final class MoneyInWordsPtBr {

    private static final String[] UNITS = {
            "",
            "um",
            "dois",
            "três",
            "quatro",
            "cinco",
            "seis",
            "sete",
            "oito",
            "nove"
    };

    private static final String[] TEENS = {
            "dez",
            "onze",
            "doze",
            "treze",
            "quatorze",
            "quinze",
            "dezesseis",
            "dezessete",
            "dezoito",
            "dezenove"
    };

    private static final String[] TENS = {
            "",
            "",
            "vinte",
            "trinta",
            "quarenta",
            "cinquenta",
            "sessenta",
            "setenta",
            "oitenta",
            "noventa"
    };

    private static final String[] HUNDREDS = {
            "",
            "cento",
            "duzentos",
            "trezentos",
            "quatrocentos",
            "quinhentos",
            "seiscentos",
            "setecentos",
            "oitocentos",
            "novecentos"
    };

    private MoneyInWordsPtBr() {
    }

    public static String format(
            BigDecimal amount) {

        BigDecimal normalized = amount
                .abs()
                .setScale(
                        2,
                        RoundingMode.HALF_UP);

        long reais;
        int centavos;

        try {

            /*
             * Remove os centavos antes de converter
             * a parte inteira para long.
             */
            reais = normalized
                    .setScale(
                            0,
                            RoundingMode.DOWN)
                    .longValueExact();

            centavos = normalized
                    .subtract(
                            BigDecimal.valueOf(
                                    reais))

                    .movePointRight(2)
                    .intValueExact();

        } catch (ArithmeticException exception) {

            throw new BusinessException(
                    "Receipt amount is too large");
        }

        List<String> parts = new ArrayList<>();

        if (reais > 0) {

            parts.add(

                    convertLong(reais)

                            + (reais == 1
                                    ? " real"
                                    : " reais"));
        }

        if (centavos > 0) {

            parts.add(

                    convertBelowThousand(
                            centavos)

                            + (centavos == 1
                                    ? " centavo"
                                    : " centavos"));
        }

        if (parts.isEmpty()) {

            return "zero reais";
        }

        return String.join(
                " e ",
                parts);
    }

    private static String convertLong(
            long value) {

        if (value > 999_999_999_999L) {

            throw new BusinessException(
                    "Receipt amount is too large");
        }

        List<String> groups = new ArrayList<>();

        long billions = value / 1_000_000_000L;

        value %= 1_000_000_000L;

        long millions = value / 1_000_000L;

        value %= 1_000_000L;

        long thousands = value / 1_000L;

        int remainder = (int) (value % 1_000L);

        if (billions > 0) {

            groups.add(

                    convertBelowThousand(
                            (int) billions)

                            + (billions == 1
                                    ? " bilhão"
                                    : " bilhões"));
        }

        if (millions > 0) {

            groups.add(

                    convertBelowThousand(
                            (int) millions)

                            + (millions == 1
                                    ? " milhão"
                                    : " milhões"));
        }

        if (thousands > 0) {

            groups.add(

                    thousands == 1
                            ? "mil"

                            : convertBelowThousand(
                                    (int) thousands)

                                    + " mil");
        }

        if (remainder > 0) {

            groups.add(
                    convertBelowThousand(
                            remainder));
        }

        return String.join(
                " e ",
                groups);
    }

    private static String convertBelowThousand(
            int value) {

        if (value <= 0
                || value > 999) {

            return "";
        }

        if (value == 100) {

            return "cem";
        }

        List<String> parts = new ArrayList<>();

        int hundreds = value / 100;

        int remainder = value % 100;

        if (hundreds > 0) {

            parts.add(
                    HUNDREDS[hundreds]);
        }

        if (remainder > 0) {

            parts.add(
                    convertBelowHundred(
                            remainder));
        }

        return String.join(
                " e ",
                parts);
    }

    private static String convertBelowHundred(
            int value) {

        if (value < 10) {

            return UNITS[value];
        }

        if (value < 20) {

            return TEENS[value - 10];
        }

        int tens = value / 10;

        int units = value % 10;

        if (units == 0) {

            return TENS[tens];
        }

        return TENS[tens]
                + " e "
                + UNITS[units];
    }
}
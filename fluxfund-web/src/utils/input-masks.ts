export type DocumentPersonType =
    | "INDIVIDUAL"
    | "LEGAL_ENTITY"

export function onlyDigits(
    value: string,
) {
    return value.replace(
        /\D/g,
        "",
    )
}

export function formatCpf(
    value: string,
) {
    const digits = onlyDigits(
        value,
    ).slice(
        0,
        11,
    )

    return digits
        .replace(
            /(\d{3})(\d)/,
            "$1.$2",
        )
        .replace(
            /(\d{3})(\d)/,
            "$1.$2",
        )
        .replace(
            /(\d{3})(\d{1,2})$/,
            "$1-$2",
        )
}

export function formatCnpj(
    value: string,
) {
    const digits = onlyDigits(
        value,
    ).slice(
        0,
        14,
    )

    return digits
        .replace(
            /^(\d{2})(\d)/,
            "$1.$2",
        )
        .replace(
            /^(\d{2})\.(\d{3})(\d)/,
            "$1.$2.$3",
        )
        .replace(
            /\.(\d{3})(\d)/,
            ".$1/$2",
        )
        .replace(
            /(\d{4})(\d)/,
            "$1-$2",
        )
}

export function formatDocument(
    value: string,
    personType:
        DocumentPersonType,
) {
    return personType ===
        "LEGAL_ENTITY"
        ? formatCnpj(
            value,
        )
        : formatCpf(
            value,
        )
}

export function formatCpfOrCnpj(
    value: string,
) {
    const digits =
        onlyDigits(
            value,
        )

    return digits.length > 11
        ? formatCnpj(
            digits,
        )
        : formatCpf(
            digits,
        )
}

export function formatPhone(
    value: string,
) {
    const digits = onlyDigits(
        value,
    ).slice(
        0,
        11,
    )

    if (!digits) {
        return ""
    }

    if (
        digits.length <= 2
    ) {
        return `(${digits}`
    }

    const areaCode =
        digits.slice(
            0,
            2,
        )

    const phoneNumber =
        digits.slice(
            2,
        )

    const prefixLength =
        digits.length === 11
            ? 5
            : 4

    const prefix =
        phoneNumber.slice(
            0,
            prefixLength,
        )

    const suffix =
        phoneNumber.slice(
            prefixLength,
        )

    if (!suffix) {
        return `(${areaCode}) ${prefix}`
    }

    return `(${areaCode}) ${prefix}-${suffix}`
}

export function formatZipCode(
    value: string,
) {
    const digits = onlyDigits(
        value,
    ).slice(
        0,
        8,
    )

    if (
        digits.length <= 5
    ) {
        return digits
    }

    return `${digits.slice(
        0,
        5,
    )}-${digits.slice(
        5,
    )}`
}
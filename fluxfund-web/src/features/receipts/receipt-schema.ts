import {
    z,
} from "zod"

import {
    incomingReceiptTypes,
} from "./receipt-labels"

const optionalText =
    z.string()
        .trim()
        .optional()

export const receiptDraftFormSchema =
    z.object({
        sourceType:
            z.enum([
                "MANUAL",
                "TRANSACTION",
                "ALLOCATION",
            ]),

        direction:
            z.enum([
                "RECEIVED_BY_ORGANIZATION",
                "PAID_BY_ORGANIZATION",
            ]),

        financialTransactionId:
            optionalText,

        transactionAllocationId:
            optionalText,

        receiptType:
            z.enum([
                "DONATION",
                "MEMBER_CONTRIBUTION",
                "CUSTOMER_PAYMENT",
                "SPONSORSHIP",
                "OTHER_INCOME",
                "SUPPORT_PAYMENT",
                "SUPPLIER_PAYMENT",
                "SERVICE_PAYMENT",
                "REIMBURSEMENT",
                "OTHER_PAYMENT",
            ]),

        amount:
            z.number()
                .positive(
                    "Informe um valor maior que zero.",
                )
                .optional(),

        paymentDate:
            optionalText,

        counterpartyMode:
            z.enum([
                "INFERRED",
                "REGISTERED",
                "MANUAL",
            ]),

        counterpartyPartyId:
            optionalText,

        counterpartyName:
            optionalText,

        counterpartyDocument:
            optionalText,

        counterpartyAddress:
            optionalText,

        beneficiaryMode:
            z.enum([
                "NONE",
                "REGISTERED",
                "MANUAL",
            ]),

        beneficiaryPartyId:
            optionalText,

        beneficiaryName:
            optionalText,

        beneficiaryDocument:
            optionalText,

        fundId:
            optionalText,

        fundName:
            optionalText,

        purposeDescription:
            optionalText,

        placeCity:
            optionalText,

        placeState:
            z.string()
                .trim()
                .max(
                    2,
                    "Use a sigla do estado.",
                )
                .optional(),

        signatoryName:
            optionalText,

        signatoryTitle:
            optionalText,

        notes:
            z.string()
                .trim()
                .max(
                    1000,
                    "Use no máximo 1000 caracteres.",
                )
                .optional(),
    })
        .superRefine(
            (
                data,
                context,
            ) => {
                if (
                    data.sourceType ===
                    "MANUAL" &&
                    !data.amount
                ) {
                    context.addIssue({
                        code:
                            "custom",

                        path: [
                            "amount",
                        ],

                        message:
                            "O valor é obrigatório em recibos manuais.",
                    })
                }

                if (
                    data.sourceType ===
                    "MANUAL" &&
                    !data.paymentDate
                ) {
                    context.addIssue({
                        code:
                            "custom",

                        path: [
                            "paymentDate",
                        ],

                        message:
                            "A data é obrigatória em recibos manuais.",
                    })
                }

                if (
                    data.counterpartyMode ===
                    "INFERRED" &&
                    data.sourceType !==
                    "ALLOCATION"
                ) {
                    context.addIssue({
                        code:
                            "custom",

                        path: [
                            "counterpartyMode",
                        ],

                        message:
                            "A inferência automática só está disponível para alocações.",
                    })
                }

                if (
                    data.counterpartyMode ===
                    "REGISTERED" &&
                    !data.counterpartyPartyId
                ) {
                    context.addIssue({
                        code:
                            "custom",

                        path: [
                            "counterpartyPartyId",
                        ],

                        message:
                            "Selecione um contato financeiro.",
                    })
                }

                if (
                    data.counterpartyMode ===
                    "MANUAL" &&
                    !data.counterpartyName
                ) {
                    context.addIssue({
                        code:
                            "custom",

                        path: [
                            "counterpartyName",
                        ],

                        message:
                            "Informe o nome da pessoa ou empresa.",
                    })
                }

                const isIncoming =
                    incomingReceiptTypes
                        .includes(
                            data.receiptType,
                        )

                const directionIsIncoming =
                    data.direction ===
                    "RECEIVED_BY_ORGANIZATION"

                if (
                    directionIsIncoming !==
                    isIncoming
                ) {
                    context.addIssue({
                        code:
                            "custom",

                        path: [
                            "receiptType",
                        ],

                        message:
                            directionIsIncoming
                                ? "Selecione um tipo de recebimento."
                                : "Selecione um tipo de pagamento.",
                    })
                }

                if (
                    directionIsIncoming &&
                    data.beneficiaryMode ===
                    "REGISTERED" &&
                    !data.beneficiaryPartyId
                ) {
                    context.addIssue({
                        code:
                            "custom",

                        path: [
                            "beneficiaryPartyId",
                        ],

                        message:
                            "Selecione o destinatário.",
                    })
                }

                if (
                    directionIsIncoming &&
                    data.beneficiaryMode ===
                    "MANUAL" &&
                    !data.beneficiaryName
                ) {
                    context.addIssue({
                        code:
                            "custom",

                        path: [
                            "beneficiaryName",
                        ],

                        message:
                            "Informe o nome do destinatário.",
                    })
                }
            },
        )

export type ReceiptDraftFormData =
    z.infer<
        typeof receiptDraftFormSchema
    >
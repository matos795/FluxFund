package com.fluxfund.api.domain.receipt.export;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.text.NumberFormat;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.font.PDFont;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.font.Standard14Fonts;
import org.apache.pdfbox.pdmodel.graphics.image.PDImageXObject;
import org.apache.pdfbox.util.Matrix;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import com.fluxfund.api.domain.organization.Organization;
import com.fluxfund.api.domain.receipt.Receipt;
import com.fluxfund.api.shared.exception.BusinessException;
import com.fluxfund.api.shared.storage.LocalFileStorageService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ReceiptPdfGenerator {

    private static final DateTimeFormatter DATE_FORMATTER =

            DateTimeFormatter.ofPattern(
                    "dd/MM/yyyy");

    private static final NumberFormat CURRENCY_FORMATTER =

            NumberFormat.getCurrencyInstance(
                    new Locale(
                            "pt",
                            "BR"));

    private static final PDFont REGULAR = new PDType1Font(

            Standard14Fonts.FontName.HELVETICA);

    private static final PDFont BOLD = new PDType1Font(

            Standard14Fonts.FontName.HELVETICA_BOLD);

    private final LocalFileStorageService storageService;

    public byte[] generate(

            Receipt receipt,

            Organization organization,

            boolean preview) {

        try (
                PDDocument document = new PDDocument();

                ByteArrayOutputStream output = new ByteArrayOutputStream()) {

            PDPage page = new PDPage(
                    PDRectangle.A4);

            document.addPage(
                    page);

            try (
                    PDPageContentStream content = new PDPageContentStream(
                            document,
                            page)) {

                drawHeader(

                        document,

                        content,

                        receipt,

                        organization,

                        preview);

                drawReceiptBody(

                        content,

                        receipt,

                        organization,

                        preview);

                if (preview) {

                    drawPreviewWatermark(
                            content);
                }
            }

            document.save(
                    output);

            return output.toByteArray();

        } catch (IOException exception) {

            throw new BusinessException(
                    "Could not generate receipt PDF");
        }
    }

    private void drawHeader(

            PDDocument document,

            PDPageContentStream content,

            Receipt receipt,

            Organization organization,

            boolean preview)

            throws IOException {

        drawOrganizationLogo(

                document,

                content,

                organization);

        String issuerName = firstText(

                receipt.getIssuerLegalName(),

                receipt.getIssuerName(),

                organization.getLegalName(),

                organization.getName());

        content.beginText();

        content.setFont(
                BOLD,
                15);

        content.newLineAtOffset(
                60,
                775);

        content.showText(
                sanitize(
                        issuerName));

        content.endText();

        String issuerDocument = firstText(

                receipt.getIssuerDocument(),

                organization.getCnpj());

        if (StringUtils.hasText(
                issuerDocument)) {

            drawText(

                    content,

                    "CNPJ: "
                            + issuerDocument,

                    60,
                    757,

                    REGULAR,
                    9);
        }

        String receiptNumber = preview

                ? "PRÉVIA — SEM VALIDADE"

                : formatReceiptNumber(
                        receipt);

        drawRightAlignedText(

                content,

                receiptNumber,

                535,
                775,

                BOLD,
                11);

        drawCenteredText(

                content,

                "RECIBO",

                297,
                700,

                BOLD,
                22);

        drawCenteredText(

                content,

                CURRENCY_FORMATTER.format(
                        receipt
                                .getAmount()
                                .abs()),

                297,
                668,

                BOLD,
                18);
    }

    private void drawReceiptBody(

            PDPageContentStream content,

            Receipt receipt,

            Organization organization,

            boolean preview)

            throws IOException {

        String bodyText = buildBodyText(

                receipt,

                organization);

        float y = drawWrappedText(

                content,

                bodyText,

                60,
                615,

                475,

                REGULAR,

                12,

                19);

        if (StringUtils.hasText(
                receipt.getBeneficiaryName())

                && receipt
                        .getReceiptType()
                        .isReceivedByOrganization()) {

            y -= 12;

            y = drawWrappedText(

                    content,

                    "Destinação informada: "
                            + receipt
                                    .getBeneficiaryName()

                            + optionalDocument(

                                    receipt
                                            .getBeneficiaryDocument())

                            + optionalFund(

                                    receipt
                                            .getFundName())

                            + ".",

                    60,
                    y,

                    475,

                    REGULAR,

                    11,

                    17);
        }

        if (StringUtils.hasText(
                receipt.getNotes())) {

            y -= 12;

            y = drawWrappedText(

                    content,

                    "Observações: "
                            + receipt.getNotes(),

                    60,
                    y,

                    475,

                    REGULAR,

                    10,

                    15);
        }

        String city = firstText(

                receipt.getPlaceCity(),

                organization.getCity());

        String state = firstText(

                receipt.getPlaceState(),

                organization.getState());

        LocalDate documentDate = preview

                ? LocalDate.now()

                : receipt.getIssueDate();

        String placeAndDate = (StringUtils.hasText(
                city)

                        ? city

                        : "Local não informado")

                + (StringUtils.hasText(
                        state)

                                ? "/"
                                        + state

                                : "")

                + ", "

                + DATE_FORMATTER.format(
                        documentDate);

        drawRightAlignedText(

                content,

                placeAndDate,

                535,
                Math.min(
                        y - 35,
                        390),

                REGULAR,
                10);

        float signatureY = 235;

        content.moveTo(
                145,
                signatureY);

        content.lineTo(
                450,
                signatureY);

        content.stroke();

        drawCenteredText(

                content,

                firstText(

                        receipt.getSignatoryName(),

                        receipt.getCounterpartyName(),

                        "Assinatura"),

                297,
                signatureY - 20,

                BOLD,
                10);

        String signatoryTitle = receipt.getSignatoryTitle();

        if (StringUtils.hasText(
                signatoryTitle)) {

            drawCenteredText(

                    content,

                    signatoryTitle,

                    297,
                    signatureY - 36,

                    REGULAR,
                    9);
        }

        String signatureDocument = resolveSignatureDocument(
                receipt);

        if (StringUtils.hasText(
                signatureDocument)) {

            drawCenteredText(

                    content,

                    "CPF/CNPJ: "
                            + signatureDocument,

                    297,
                    signatureY - 52,

                    REGULAR,
                    9);
        }

        content.setStrokingColor(
                new Color(
                        210,
                        210,
                        210));

        content.moveTo(
                60,
                115);

        content.lineTo(
                535,
                115);

        content.stroke();

        content.setStrokingColor(
                Color.BLACK);

        drawWrappedText(

                content,

                "Este recibo comprova exclusivamente o pagamento descrito e não substitui documento fiscal quando sua emissão for exigida.",

                60,
                98,

                475,

                REGULAR,
                8,
                11);
    }

    private String buildBodyText(

            Receipt receipt,

            Organization organization) {

        String amountNumeric = CURRENCY_FORMATTER.format(

                receipt
                        .getAmount()
                        .abs());

        String amountWords = MoneyInWordsPtBr.format(

                receipt
                        .getAmount()
                        .abs());

        if (receipt.getReceiptType()
                .isReceivedByOrganization()) {

            return "Recebemos de "
                    + receipt
                            .getCounterpartyName()

                    + optionalDocument(
                            receipt
                                    .getCounterpartyDocument())

                    + " a importância de "
                    + amountNumeric

                    + " ("
                    + amountWords
                    + "), referente a "

                    + receipt
                            .getPurposeDescription()

                    + ", com pagamento realizado em "

                    + DATE_FORMATTER.format(
                            receipt
                                    .getPaymentDate())

                    + ".";
        }

        String organizationName = firstText(

                receipt.getIssuerLegalName(),

                receipt.getIssuerName(),

                organization.getLegalName(),

                organization.getName());

        String organizationDocument = firstText(

                receipt.getIssuerDocument(),

                organization.getCnpj());

        return "Declaro ter recebido de "
                + organizationName

                + optionalDocument(
                        organizationDocument)

                + " a importância de "
                + amountNumeric

                + " ("
                + amountWords
                + "), referente a "

                + receipt
                        .getPurposeDescription()

                + ", com pagamento realizado em "

                + DATE_FORMATTER.format(
                        receipt
                                .getPaymentDate())

                + ".";
    }

    private void drawOrganizationLogo(

            PDDocument document,

            PDPageContentStream content,

            Organization organization) {

        if (!StringUtils.hasText(
                organization
                        .getLogoStorageKey())) {

            return;
        }

        try {

            byte[] imageBytes = storageService.read(

                    organization
                            .getLogoStorageKey());

            PDImageXObject image = PDImageXObject
                    .createFromByteArray(

                            document,

                            imageBytes,

                            "organization-logo");

            float maxWidth = 38;

            float maxHeight = 38;

            float scale = Math.min(

                    maxWidth /
                            image.getWidth(),

                    maxHeight /
                            image.getHeight());

            content.drawImage(

                    image,

                    15,
                    747,

                    image.getWidth()
                            * scale,

                    image.getHeight()
                            * scale);

        } catch (Exception ignored) {

            /*
             * Um logo inválido não pode impedir
             * a emissão do recibo.
             */
        }
    }

    private void drawPreviewWatermark(
            PDPageContentStream content)

            throws IOException {

        content.saveGraphicsState();

        content.setNonStrokingColor(
                new Color(
                        210,
                        210,
                        210));

        content.beginText();

        content.setFont(
                BOLD,
                44);

        content.setTextMatrix(

                Matrix.getRotateInstance(

                        Math.toRadians(
                                35),

                        110,
                        360));

        content.showText(
                "SEM VALIDADE");

        content.endText();

        content.restoreGraphicsState();
    }

    private float drawWrappedText(

            PDPageContentStream content,

            String text,

            float x,

            float y,

            float maxWidth,

            PDFont font,

            float fontSize,

            float lineHeight)

            throws IOException {

        for (String line : wrapText(

                sanitize(text),

                font,

                fontSize,

                maxWidth)) {

            drawText(

                    content,

                    line,

                    x,

                    y,

                    font,

                    fontSize);

            y -= lineHeight;
        }

        return y;
    }

    private List<String> wrapText(

            String text,

            PDFont font,

            float fontSize,

            float maxWidth)

            throws IOException {

        List<String> lines = new ArrayList<>();

        StringBuilder current = new StringBuilder();

        for (String word : text.split("\\s+")) {

            String candidate = current.isEmpty()

                    ? word

                    : current
                            + " "
                            + word;

            float width = font.getStringWidth(
                    candidate)

                    / 1000f

                    * fontSize;

            if (width > maxWidth
                    && !current.isEmpty()) {

                lines.add(
                        current.toString());

                current = new StringBuilder(
                        word);

            } else {

                current = new StringBuilder(
                        candidate);
            }
        }

        if (!current.isEmpty()) {

            lines.add(
                    current.toString());
        }

        return lines;
    }

    private void drawText(

            PDPageContentStream content,

            String text,

            float x,

            float y,

            PDFont font,

            float fontSize)

            throws IOException {

        content.beginText();

        content.setFont(
                font,
                fontSize);

        content.newLineAtOffset(
                x,
                y);

        content.showText(
                sanitize(
                        text));

        content.endText();
    }

    private void drawCenteredText(

            PDPageContentStream content,

            String text,

            float centerX,

            float y,

            PDFont font,

            float fontSize)

            throws IOException {

        String safeText = sanitize(
                text);

        float width = font.getStringWidth(
                safeText)

                / 1000f

                * fontSize;

        drawText(

                content,

                safeText,

                centerX
                        - width / 2,

                y,

                font,

                fontSize);
    }

    private void drawRightAlignedText(

            PDPageContentStream content,

            String text,

            float rightX,

            float y,

            PDFont font,

            float fontSize)

            throws IOException {

        String safeText = sanitize(
                text);

        float width = font.getStringWidth(
                safeText)

                / 1000f

                * fontSize;

        drawText(

                content,

                safeText,

                rightX - width,

                y,

                font,

                fontSize);
    }

    private String optionalDocument(
            String document) {

        return StringUtils.hasText(
                document)

                        ? ", CPF/CNPJ "
                                + document

                        : "";
    }

    private String optionalFund(
            String fundName) {

        return StringUtils.hasText(
                fundName)

                        ? ", fundo "
                                + fundName

                        : "";
    }

    private String resolveSignatureDocument(
            Receipt receipt) {

        if (receipt.getReceiptType()
                .isPaidByOrganization()) {

            return receipt
                    .getCounterpartyDocument();
        }

        return receipt
                .getIssuerDocument();
    }

    private String formatReceiptNumber(
            Receipt receipt) {

        return "REC-%d-%06d"
                .formatted(

                        receipt
                                .getSequenceYear(),

                        receipt
                                .getSequenceNumber());
    }

    private String firstText(
            String... values) {

        for (String value : values) {

            if (StringUtils.hasText(
                    value)) {

                return value.trim();
            }
        }

        return null;
    }

    private String sanitize(
            String value) {

        if (value == null) {

            return "";
        }

        return value
                .replaceAll(
                        "[^\\u0020-\\u00FF]",
                        " ")

                .replaceAll(
                        "\\s+",
                        " ")

                .trim();
    }
}
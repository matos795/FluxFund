package com.fluxfund.api.shared.mail;

import java.time.OffsetDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.util.HtmlUtils;

import com.fluxfund.api.domain.organizationuser.OrganizationRole;

import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
public class ApplicationMailService {

    private static final DateTimeFormatter
            DATE_TIME_FORMATTER =
            DateTimeFormatter.ofPattern(
                    "dd/MM/yyyy 'às' HH:mm");

    private final RestClient brevoClient;

    private final boolean enabled;

    private final String apiKey;

    private final String from;

    private final String senderName;

    public ApplicationMailService(
            RestClient.Builder restClientBuilder,

            @Value("${app.mail.enabled:false}")
            boolean enabled,

            @Value("${app.mail.brevo-api-key:}")
            String apiKey,

            @Value("${app.mail.from:}")
            String from,

            @Value("${app.mail.sender-name:FluxFund}")
            String senderName) {

        this.brevoClient =
                restClientBuilder
                        .baseUrl(
                                "https://api.brevo.com/v3")

                        .defaultHeader(
                                HttpHeaders.ACCEPT,
                                MediaType
                                        .APPLICATION_JSON_VALUE)

                        .defaultHeader(
                                HttpHeaders.CONTENT_TYPE,
                                MediaType
                                        .APPLICATION_JSON_VALUE)

                        .build();

        this.enabled = enabled;
        this.apiKey = apiKey;
        this.from = from;
        this.senderName = senderName;
    }

    public boolean sendOrganizationInvitation(
            String recipientName,
            String recipientEmail,
            String organizationName,
            OrganizationRole role,
            String invitationUrl,
            OffsetDateTime expiresAt) {

        return sendTransactionalEmail(
                recipientName,
                recipientEmail,

                "Convite para acessar "
                        + organizationName
                        + " no FluxFund",

                buildOrganizationInvitationHtml(
                        recipientName,
                        organizationName,
                        role,
                        invitationUrl,
                        expiresAt),

                "organization-invitation",
                "Invitation");
    }

    public boolean sendPasswordReset(
            String recipientName,
            String recipientEmail,
            String resetUrl,
            OffsetDateTime expiresAt) {

        return sendTransactionalEmail(
                recipientName,
                recipientEmail,

                "Redefinição de senha do FluxFund",

                buildPasswordResetHtml(
                        recipientName,
                        resetUrl,
                        expiresAt),

                "password-reset",
                "Password reset");
    }

    private boolean sendTransactionalEmail(
            String recipientName,
            String recipientEmail,
            String subject,
            String htmlContent,
            String tag,
            String logContext) {

        if (!enabled) {
            log.info(
                    "{} email disabled. recipient={}",
                    logContext,
                    recipientEmail);

            return false;
        }

        if (apiKey == null
                || apiKey.isBlank()) {

            log.error(
                    "Brevo API key was not configured");

            return false;
        }

        if (from == null
                || from.isBlank()) {

            log.error(
                    "Mail sender was not configured");

            return false;
        }

        BrevoEmailAddress sender =
                new BrevoEmailAddress(
                        from,
                        senderName);

        BrevoEmailAddress recipient =
                new BrevoEmailAddress(
                        recipientEmail,
                        recipientName);

        BrevoEmailRequest request =
                new BrevoEmailRequest(
                        sender,
                        List.of(recipient),
                        sender,
                        subject,
                        htmlContent,
                        List.of(tag));

        try {
            BrevoEmailResponse response =
                    brevoClient
                            .post()
                            .uri("/smtp/email")

                            .header(
                                    "api-key",
                                    apiKey)

                            .body(request)
                            .retrieve()

                            .body(
                                    BrevoEmailResponse.class);

            log.info(
                    "{} email sent through Brevo. "
                            + "recipient={} messageId={}",

                    logContext,
                    recipientEmail,

                    response != null
                            ? response.messageId()
                            : null);

            return true;

        } catch (
                RestClientResponseException exception
        ) {
            log.error(
                    "Brevo rejected {} email. "
                            + "recipient={} status={} body={}",

                    logContext,
                    recipientEmail,

                    exception
                            .getStatusCode()
                            .value(),

                    exception
                            .getResponseBodyAsString());

            return false;

        } catch (
                RestClientException exception
        ) {
            log.error(
                    "Could not connect to Brevo for {}. "
                            + "recipient={}",

                    logContext,
                    recipientEmail,
                    exception);

            return false;
        }
    }

    private String buildOrganizationInvitationHtml(
            String recipientName,
            String organizationName,
            OrganizationRole role,
            String invitationUrl,
            OffsetDateTime expiresAt) {

        String safeRecipientName =
                HtmlUtils.htmlEscape(
                        recipientName);

        String safeOrganizationName =
                HtmlUtils.htmlEscape(
                        organizationName);

        String safeInvitationUrl =
                HtmlUtils.htmlEscape(
                        invitationUrl);

        return """
                <!doctype html>
                <html lang="pt-BR">
                <body style="margin:0;background:#f4f4f5;font-family:Arial,sans-serif;color:#18181b;">
                    <div style="max-width:600px;margin:0 auto;padding:32px 16px;">
                        <div style="background:#ffffff;border:1px solid #e4e4e7;border-radius:16px;padding:32px;">

                            <div style="margin-bottom:24px;">
                                <p style="margin:0;font-size:14px;font-weight:bold;color:#52525b;">
                                    FLUXFUND
                                </p>

                                <h1 style="margin:8px 0 0;font-size:24px;">
                                    Convite de acesso
                                </h1>
                            </div>

                            <p>
                                Olá,
                                <strong>%s</strong>!
                            </p>

                            <p style="line-height:1.6;">
                                Você foi convidado para acessar
                                <strong>%s</strong>
                                no FluxFund.
                            </p>

                            <div style="background:#f4f4f5;border-radius:12px;padding:16px;margin:24px 0;">
                                <p style="margin:0 0 8px;">
                                    <strong>Papel de acesso:</strong>
                                    %s
                                </p>

                                <p style="margin:0;">
                                    <strong>Expira em:</strong>
                                    %s
                                </p>
                            </div>

                            <a
                                href="%s"
                                style="display:inline-block;background:#18181b;color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:10px;font-weight:bold;"
                            >
                                Aceitar convite
                            </a>

                            <p style="margin-top:24px;font-size:13px;line-height:1.5;color:#71717a;">
                                Caso o botão não funcione, copie e cole
                                este endereço no navegador:
                            </p>

                            <p style="font-size:12px;line-height:1.5;word-break:break-all;color:#52525b;">
                                %s
                            </p>

                            <p style="margin-top:24px;font-size:13px;color:#71717a;">
                                Caso você não reconheça este convite,
                                ignore esta mensagem.
                            </p>
                        </div>
                    </div>
                </body>
                </html>
                """
                .formatted(
                        safeRecipientName,
                        safeOrganizationName,
                        resolveRoleLabel(role),
                        formatDateTime(expiresAt),
                        safeInvitationUrl,
                        safeInvitationUrl);
    }

    private String buildPasswordResetHtml(
            String recipientName,
            String resetUrl,
            OffsetDateTime expiresAt) {

        String safeRecipientName =
                HtmlUtils.htmlEscape(
                        recipientName);

        String safeResetUrl =
                HtmlUtils.htmlEscape(
                        resetUrl);

        return """
                <!doctype html>
                <html lang="pt-BR">
                <body style="margin:0;background:#f4f4f5;font-family:Arial,sans-serif;color:#18181b;">
                    <div style="max-width:600px;margin:0 auto;padding:32px 16px;">
                        <div style="background:#ffffff;border:1px solid #e4e4e7;border-radius:16px;padding:32px;">

                            <div style="margin-bottom:24px;">
                                <p style="margin:0;font-size:14px;font-weight:bold;color:#52525b;">
                                    FLUXFUND
                                </p>

                                <h1 style="margin:8px 0 0;font-size:24px;">
                                    Redefinição de senha
                                </h1>
                            </div>

                            <p>
                                Olá,
                                <strong>%s</strong>!
                            </p>

                            <p style="line-height:1.6;">
                                Recebemos uma solicitação para
                                redefinir a senha da sua conta
                                no FluxFund.
                            </p>

                            <div style="background:#f4f4f5;border-radius:12px;padding:16px;margin:24px 0;">
                                <p style="margin:0;">
                                    <strong>Este link expira em:</strong>
                                    %s
                                </p>
                            </div>

                            <a
                                href="%s"
                                style="display:inline-block;background:#18181b;color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:10px;font-weight:bold;"
                            >
                                Criar nova senha
                            </a>

                            <p style="margin-top:24px;font-size:13px;line-height:1.5;color:#71717a;">
                                Caso o botão não funcione, copie e
                                cole este endereço no navegador:
                            </p>

                            <p style="font-size:12px;line-height:1.5;word-break:break-all;color:#52525b;">
                                %s
                            </p>

                            <p style="margin-top:24px;font-size:13px;line-height:1.5;color:#71717a;">
                                Caso você não tenha solicitado esta
                                alteração, ignore esta mensagem.
                                Sua senha atual continuará funcionando.
                            </p>

                            <p style="font-size:13px;line-height:1.5;color:#71717a;">
                                Nunca compartilhe este link com outras
                                pessoas.
                            </p>
                        </div>
                    </div>
                </body>
                </html>
                """
                .formatted(
                        safeRecipientName,
                        formatDateTime(expiresAt),
                        safeResetUrl,
                        safeResetUrl);
    }

    private String resolveRoleLabel(
            OrganizationRole role) {

        return switch (role) {
            case OWNER -> "Proprietário";
            case ADMIN -> "Administrador";
            case FINANCE -> "Financeiro";
            case VIEWER -> "Visualizador";
        };
    }

    private String formatDateTime(
            OffsetDateTime dateTime) {

        return dateTime.format(
                DATE_TIME_FORMATTER);
    }

    private record BrevoEmailAddress(
            String email,
            String name
    ) {
    }

    private record BrevoEmailRequest(
            BrevoEmailAddress sender,
            List<BrevoEmailAddress> to,
            BrevoEmailAddress replyTo,
            String subject,
            String htmlContent,
            List<String> tags
    ) {
    }

    private record BrevoEmailResponse(
            String messageId
    ) {
    }
}
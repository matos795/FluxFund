package com.fluxfund.api.shared.mail;

import java.nio.charset.StandardCharsets;
import java.time.OffsetDateTime;
import java.time.format.DateTimeFormatter;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.springframework.web.util.HtmlUtils;

import com.fluxfund.api.domain.organizationuser.OrganizationRole;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class ApplicationMailService {

    private static final DateTimeFormatter DATE_TIME_FORMATTER = DateTimeFormatter.ofPattern(
            "dd/MM/yyyy 'às' HH:mm");

    private final JavaMailSender mailSender;

    @Value("${app.mail.enabled:false}")
    private boolean enabled;

    @Value("${app.mail.from}")
    private String from;

    public boolean sendOrganizationInvitation(
            String recipientName,
            String recipientEmail,
            String organizationName,
            OrganizationRole role,
            String invitationUrl,
            OffsetDateTime expiresAt) {

        if (!enabled) {
            log.info(
                    "Invitation email disabled. recipient={}",
                    recipientEmail);

            return false;
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();

            MimeMessageHelper helper = new MimeMessageHelper(
                    message,
                    true,
                    StandardCharsets.UTF_8.name());

            helper.setFrom(from);
            helper.setTo(recipientEmail);

            helper.setSubject(
                    "Convite para acessar "
                            + organizationName
                            + " no FluxFund");

            helper.setText(
                    buildPlainText(
                            recipientName,
                            organizationName,
                            role,
                            invitationUrl,
                            expiresAt),

                    buildHtml(
                            recipientName,
                            organizationName,
                            role,
                            invitationUrl,
                            expiresAt));

            mailSender.send(message);

            log.info(
                    "Invitation email sent. recipient={}",
                    recipientEmail);

            return true;

        } catch (
                MessagingException
                | MailException exception) {
            /*
             * O convite continua válido mesmo quando
             * o provedor de e-mail estiver indisponível.
             * O administrador poderá copiar o link.
             */
            log.error(
                    "Could not send invitation email. recipient={}",
                    recipientEmail,
                    exception);

            return false;
        }
    }

    private String buildPlainText(
            String recipientName,
            String organizationName,
            OrganizationRole role,
            String invitationUrl,
            OffsetDateTime expiresAt) {

        return """
                Olá, %s!

                Você foi convidado para acessar a organização %s no FluxFund.

                Papel de acesso: %s
                O convite expira em: %s

                Acesse o link abaixo para aceitar:
                %s

                Caso você não reconheça este convite, ignore esta mensagem.
                """
                .formatted(
                        recipientName,
                        organizationName,
                        resolveRoleLabel(role),
                        formatDateTime(expiresAt),
                        invitationUrl);
    }

    private String buildHtml(
            String recipientName,
            String organizationName,
            OrganizationRole role,
            String invitationUrl,
            OffsetDateTime expiresAt) {

        String safeRecipientName = HtmlUtils.htmlEscape(
                recipientName);

        String safeOrganizationName = HtmlUtils.htmlEscape(
                organizationName);

        String safeInvitationUrl = HtmlUtils.htmlEscape(
                invitationUrl);

        return """
                <!doctype html>
                <html lang="pt-BR">
                <body style="margin:0;background:#f4f4f5;font-family:Arial,sans-serif;color:#18181b;">
                    <div style="max-width:600px;margin:0 auto;padding:32px 16px;">
                        <div style="background:#ffffff;border:1px solid #e4e4e7;border-radius:16px;padding:32px;">
                            <h1 style="margin:0 0 16px;font-size:24px;">
                                Convite para o FluxFund
                            </h1>

                            <p>Olá, <strong>%s</strong>!</p>

                            <p>
                                Você foi convidado para acessar
                                <strong>%s</strong> no FluxFund.
                            </p>

                            <div style="background:#f4f4f5;border-radius:12px;padding:16px;margin:24px 0;">
                                <p style="margin:0 0 8px;">
                                    <strong>Papel:</strong> %s
                                </p>

                                <p style="margin:0;">
                                    <strong>Expira em:</strong> %s
                                </p>
                            </div>

                            <a
                                href="%s"
                                style="display:inline-block;background:#18181b;color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:10px;font-weight:bold;"
                            >
                                Aceitar convite
                            </a>

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
                        safeInvitationUrl);
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
}
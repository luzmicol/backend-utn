import { fileURLToPath } from 'url'
import path from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export const LOOP_EMAIL_LOGO_CID = 'loop-email-logo'
export const LOOP_EMAIL_LOGO_ATTACHMENT = {
    filename: 'loop-email-logo.png',
    path: path.join(__dirname, 'assets', 'loop-email-logo.png'),
    cid: LOOP_EMAIL_LOGO_CID,
    contentDisposition: 'inline'
}

/*
Sistema visual compartido para los correos transaccionales de LOOP.
Construido con tablas HTML y estilos inline para maxima compatibilidad con
Gmail, Outlook y clientes moviles.
*/
export function renderLoopEmail({
    documentTitle,
    preheader,
    logoUrl = `cid:${LOOP_EMAIL_LOGO_CID}`,
    badgeLabel,
    heading,
    bodyText,
    ctaLabel,
    ctaUrl,
    fallbackLabel,
    expiryNotice,
    footerNote
}) {
    const headerLogoMarkup = `<img src="${logoUrl}" alt="LOOP" width="148" style="display:block; width:148px; max-width:100%; height:auto; border:0; outline:none; text-decoration:none; margin:0 auto;" />`

    return `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="color-scheme" content="dark" />
    <meta name="supported-color-schemes" content="dark" />
    <title>${documentTitle}</title>
</head>
<body style="margin:0; padding:0; background-color:#0b0b10; -webkit-font-smoothing:antialiased;">

    <!-- Preheader oculto para vista previa en bandeja de entrada -->
    <div style="display:none; max-height:0; overflow:hidden; opacity:0; mso-hide:all;">
        ${preheader}
    </div>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#0b0b10;">
        <tr>
            <td align="center" style="padding:20px 12px;">

                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:540px;">

                    <!-- Encabezado horizontal con logo LOOP -->
                    <tr>
                        <td align="center" style="padding:0 0 14px;">
                            ${headerLogoMarkup}
                        </td>
                    </tr>

                    <!-- Tarjeta principal -->
                    <tr>
                        <td style="background-color:#14141c; border:1px solid #262536; border-radius:16px; overflow:hidden;">

                            <!-- Franja superior violeta -->
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                                <tr>
                                    <td height="3" bgcolor="#8b5cf6" style="height:3px; line-height:3px; font-size:0; background-color:#8b5cf6;">&nbsp;</td>
                                </tr>
                            </table>

                            <!-- Contenido interior compacto -->
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                                <tr>
                                    <td style="padding:22px 24px 20px;">

                                        <p style="margin:0 0 6px; font-family:'Inter','-apple-system','Segoe UI',Arial,sans-serif; font-size:11px; font-weight:600; letter-spacing:0.08em; text-transform:uppercase; color:#b9a3ff;">
                                            ${badgeLabel}
                                        </p>

                                        <h1 style="margin:0 0 8px; font-family:'Inter','-apple-system','Segoe UI',Arial,sans-serif; font-size:21px; line-height:1.25; font-weight:700; color:#f5f3ff;">
                                            ${heading}
                                        </h1>

                                        <p style="margin:0 0 18px; font-family:'Inter','-apple-system','Segoe UI',Arial,sans-serif; font-size:14px; line-height:1.55; color:#a19eb5;">
                                            ${bodyText}
                                        </p>

                                        <!-- Boton principal -->
                                        <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 18px;">
                                            <tr>
                                                <td align="center" bgcolor="#8b5cf6" style="background-color:#8b5cf6; border-radius:999px;">
                                                    <a href="${ctaUrl}"
                                                        style="display:inline-block; padding:11px 28px; border-radius:999px; font-family:'Inter','-apple-system','Segoe UI',Arial,sans-serif; font-size:14px; font-weight:600; color:#f5f3ff; text-decoration:none;">
                                                        ${ctaLabel}
                                                    </a>
                                                </td>
                                            </tr>
                                        </table>

                                        <!-- Aviso de vencimiento compacto -->
                                        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 16px;">
                                            <tr>
                                                <td bgcolor="#1c1b27" style="background-color:#1c1b27; border:1px solid #262536; border-radius:10px; padding:10px 14px;">
                                                    <p style="margin:0; font-family:'Inter','-apple-system','Segoe UI',Arial,sans-serif; font-size:13px; line-height:1.45; color:#b9a3ff;">
                                                        ${expiryNotice}
                                                    </p>
                                                </td>
                                            </tr>
                                        </table>

                                        <!-- Enlace alternativo accesible (sin exponer el JWT) -->
                                        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                                            <tr>
                                                <td style="border-top:1px solid #262536; padding-top:14px;">
                                                    <p style="margin:0 0 4px; font-family:'Inter','-apple-system','Segoe UI',Arial,sans-serif; font-size:12px; line-height:1.45; color:#a19eb5;">
                                                        Si el bot&oacute;n no funciona, pod&eacute;s continuar desde aqu&iacute;:
                                                    </p>
                                                    <p style="margin:0; font-family:'Inter','-apple-system','Segoe UI',Arial,sans-serif; font-size:13px; line-height:1.45;">
                                                        <a href="${ctaUrl}" style="color:#b9a3ff; font-weight:600; text-decoration:underline;">${fallbackLabel}</a>
                                                    </p>
                                                </td>
                                            </tr>
                                        </table>

                                    </td>
                                </tr>
                            </table>

                        </td>
                    </tr>

                    <!-- Pie compacto con identidad LOOP -->
                    <tr>
                        <td align="center" style="padding:14px 8px 0;">
                            <p style="margin:0 0 6px; font-family:'Inter','-apple-system','Segoe UI',Arial,sans-serif; font-size:11px; font-weight:600; letter-spacing:0.12em; text-transform:uppercase; color:#b9a3ff;">
                                CONECT&Aacute;. COMPART&Iacute;. DESCUBR&Iacute;.
                            </p>
                            <p style="margin:0 0 4px; font-family:'Inter','-apple-system','Segoe UI',Arial,sans-serif; font-size:12px; line-height:1.45; color:#a19eb5;">
                                ${footerNote}
                            </p>
                            <p style="margin:0; font-family:'Inter','-apple-system','Segoe UI',Arial,sans-serif; font-size:11px; line-height:1.45; color:#7c7894;">
                                &copy; LOOP &middot; Mensaje autom&aacute;tico, no respondas a este correo.
                            </p>
                        </td>
                    </tr>

                </table>

            </td>
        </tr>
    </table>

</body>
</html>
`
}

/*
Sistema visual compartido para los correos transaccionales de LOOP.
Construido con tablas HTML y estilos inline para maxima compatibilidad con
Gmail, Outlook y clientes moviles, sin depender de imagenes externas ni SVG.
*/
export function renderLoopEmail({
    documentTitle,
    preheader,
    logoUrl = '',
    badgeLabel,
    heading,
    bodyText,
    ctaLabel,
    ctaUrl,
    fallbackLabel,
    expiryNotice,
    footerNote
}) {
    const headerLogoMarkup = logoUrl
        ? `<img src="${logoUrl}" alt="LOOP" width="188" style="display:block; width:188px; max-width:100%; height:auto; border:0; outline:none; text-decoration:none; margin:0 auto;" />`
        : `<span style="font-family:'Inter','-apple-system','Segoe UI',Arial,sans-serif; font-size:22px; font-weight:800; letter-spacing:0.1em; color:#f5f3ff;">L<span style="color:#b9a3ff;">OO</span>P</span>`

    const footerLogoMarkup = logoUrl
        ? `<img src="${logoUrl}" alt="LOOP" width="116" style="display:block; width:116px; max-width:100%; height:auto; border:0; outline:none; text-decoration:none; margin:0 auto 10px;" />`
        : ''

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
            <td align="center" style="padding:40px 16px;">

                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;">

                    <!-- Encabezado horizontal con logo LOOP -->
                    <tr>
                        <td align="center" style="padding:0 0 24px;">
                            ${headerLogoMarkup}
                        </td>
                    </tr>

                    <!-- Tarjeta principal -->
                    <tr>
                        <td style="background-color:#14141c; border:1px solid #262536; border-radius:16px; overflow:hidden;">

                            <!-- Franja superior violeta -->
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                                <tr>
                                    <td height="4" bgcolor="#8b5cf6" style="height:4px; line-height:4px; font-size:0; background-color:#8b5cf6;">&nbsp;</td>
                                </tr>
                            </table>

                            <!-- Contenido interior -->
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                                <tr>
                                    <td style="padding:36px 32px 32px;">

                                        <!-- Etiqueta superior -->
                                        <p style="margin:0 0 12px; font-family:'Inter','-apple-system','Segoe UI',Arial,sans-serif; font-size:12px; font-weight:600; letter-spacing:0.08em; text-transform:uppercase; color:#b9a3ff;">
                                            ${badgeLabel}
                                        </p>

                                        <!-- Titulo principal -->
                                        <h1 style="margin:0 0 14px; font-family:'Inter','-apple-system','Segoe UI',Arial,sans-serif; font-size:24px; line-height:1.25; font-weight:700; color:#f5f3ff;">
                                            ${heading}
                                        </h1>

                                        <!-- Descripcion -->
                                        <p style="margin:0 0 28px; font-family:'Inter','-apple-system','Segoe UI',Arial,sans-serif; font-size:15px; line-height:1.6; color:#a19eb5;">
                                            ${bodyText}
                                        </p>

                                        <!-- Boton principal -->
                                        <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 28px;">
                                            <tr>
                                                <td align="center" bgcolor="#8b5cf6" style="background-color:#8b5cf6; border-radius:999px;">
                                                    <a href="${ctaUrl}"
                                                        style="display:inline-block; padding:14px 36px; border-radius:999px; font-family:'Inter','-apple-system','Segoe UI',Arial,sans-serif; font-size:15px; font-weight:600; color:#f5f3ff; text-decoration:none;">
                                                        ${ctaLabel}
                                                    </a>
                                                </td>
                                            </tr>
                                        </table>

                                        <!-- Aviso de vencimiento en superficie elevada -->
                                        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 24px;">
                                            <tr>
                                                <td bgcolor="#1c1b27" style="background-color:#1c1b27; border:1px solid #262536; border-radius:12px; padding:14px 16px;">
                                                    <p style="margin:0; font-family:'Inter','-apple-system','Segoe UI',Arial,sans-serif; font-size:13px; line-height:1.5; color:#b9a3ff;">
                                                        ${expiryNotice}
                                                    </p>
                                                </td>
                                            </tr>
                                        </table>

                                        <!-- Enlace alternativo accesible (sin exponer el JWT) -->
                                        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                                            <tr>
                                                <td style="border-top:1px solid #262536; padding-top:20px;">
                                                    <p style="margin:0 0 6px; font-family:'Inter','-apple-system','Segoe UI',Arial,sans-serif; font-size:13px; line-height:1.5; color:#a19eb5;">
                                                        Si el bot&oacute;n no funciona, pod&eacute;s continuar desde el siguiente enlace:
                                                    </p>
                                                    <p style="margin:0; font-family:'Inter','-apple-system','Segoe UI',Arial,sans-serif; font-size:13px; line-height:1.5;">
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

                    <!-- Pie con identidad LOOP -->
                    <tr>
                        <td align="center" style="padding:24px 12px 0;">
                            ${footerLogoMarkup}
                            <p style="margin:0 0 10px; font-family:'Inter','-apple-system','Segoe UI',Arial,sans-serif; font-size:11px; font-weight:600; letter-spacing:0.14em; text-transform:uppercase; color:#b9a3ff;">
                                CONECT&Aacute;. COMPART&Iacute;. DESCUBR&Iacute;.
                            </p>
                            <p style="margin:0 0 8px; font-family:'Inter','-apple-system','Segoe UI',Arial,sans-serif; font-size:12px; line-height:1.5; color:#a19eb5;">
                                ${footerNote}
                            </p>
                            <p style="margin:0; font-family:'Inter','-apple-system','Segoe UI',Arial,sans-serif; font-size:12px; line-height:1.5; color:#7c7894;">
                                &copy; LOOP &middot; Mensaje autom&aacute;tico, por favor no respondas a este correo.
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

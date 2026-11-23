/*
Plantilla HTML del correo para restablecer la contraseña en LOOP.
Usa estilos inline y tablas para compatibilidad con Gmail, Outlook y clientes moviles.
*/
export default function passwordResetEmail(reset_link) {
    return `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>LOOP — Restablecer contraseña</title>
</head>
<body style="margin:0; padding:0; background-color:#0b0b10;">

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#0b0b10;">
        <tr>
            <td align="center" style="padding:40px 16px;">

                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;">

                    <tr>
                        <td align="center" style="padding:0 8px 24px;">
                            <span style="font-family:'Inter','-apple-system','Segoe UI',Arial,sans-serif; font-size:24px; font-weight:700; color:#b9a3ff; letter-spacing:0.08em;">
                                LOOP
                            </span>
                        </td>
                    </tr>

                    <tr>
                        <td style="background-color:#14141c; border:1px solid #262536; border-radius:16px; padding:40px 36px 36px;">

                            <h1 style="margin:0 0 12px; font-family:'Inter',Arial,sans-serif; font-size:24px; line-height:1.25; font-weight:700; color:#f5f3ff;">
                                Restablecer contraseña
                            </h1>

                            <p style="margin:0 0 28px; font-family:'Inter',Arial,sans-serif; font-size:15px; line-height:1.6; color:#a19eb5;">
                                Recibimos una solicitud para cambiar la contraseña de tu cuenta en LOOP. Toc&aacute; el bot&oacute;n de abajo para elegir una nueva.
                            </p>

                            <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:28px;">
                                <tr>
                                    <td align="center" bgcolor="#8b5cf6" style="background-color:#8b5cf6; border-radius:999px;">
                                        <a href="${reset_link}"
                                            style="display:inline-block; padding:14px 36px; border-radius:999px; font-family:'Inter',Arial,sans-serif; font-size:15px; font-weight:600; color:#f5f3ff; text-decoration:none;">
                                            Restablecer mi contraseña
                                        </a>
                                    </td>
                                </tr>
                            </table>

                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                                <tr>
                                    <td style="border-top:1px solid #262536; padding-top:20px;">
                                        <p style="margin:0 0 8px; font-family:'Inter',Arial,sans-serif; font-size:13px; line-height:1.6; color:#a19eb5;">
                                            Si el bot&oacute;n no funciona, pod&eacute;s continuar desde el siguiente enlace:
                                        </p>
                                        <p style="margin:0; font-family:'Inter',Arial,sans-serif; font-size:13px; line-height:1.5;">
                                            <a href="${reset_link}" style="color:#b9a3ff; font-weight:600; text-decoration:underline;">Restablecer mi contraseña en LOOP</a>
                                        </p>
                                    </td>
                                </tr>
                            </table>

                        </td>
                    </tr>

                    <tr>
                        <td align="center" style="padding:24px 8px 0;">
                            <p style="margin:0 0 6px; font-family:'Inter',Arial,sans-serif; font-size:12px; line-height:1.5; color:#a19eb5;">
                                Este enlace vence en 15 minutos. Si no solicitaste cambiar tu contraseña, pod&eacute;s ignorar este correo.
                            </p>
                            <p style="margin:0; font-family:'Inter',Arial,sans-serif; font-size:12px; line-height:1.5; color:#a19eb5;">
                                Este mensaje fue enviado autom&aacute;ticamente por LOOP. Por favor, no respondas a este correo.
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


/*
Plantilla HTML del mail para restablecer la contraseña.
Recibe el reset_link y devuelve el HTML completo.
*/

export default function passwordResetEmail(reset_link) {
    return `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Restablecer contraseña</title>
</head>
<body style="margin:0; padding:0; background-color:#f4f1f6;">

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
            <td align="center" style="padding:40px 16px;">

                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;">

                    <tr>
                        <td align="center" style="padding:0 8px 24px;">
                            <span style="font-family:'Open Sans','-apple-system','Segoe UI',Arial,sans-serif; font-size:22px; font-weight:700; color:#481a54; letter-spacing:-0.5px;">
                                Slack
                            </span>
                        </td>
                    </tr>

                    <tr>
                        <td style="background-color:#ffffff; border:1px solid #d5cfe0; border-radius:16px; padding:40px 40px 36px;">

                            <h1 style="margin:0 0 12px; font-family:'Open Sans',Arial,sans-serif; font-size:26px; line-height:1.2; font-weight:700; color:#181818;">
                                Restablecer contraseña
                            </h1>

                            <p style="margin:0 0 28px; font-family:'Open Sans',Arial,sans-serif; font-size:15px; line-height:1.6; color:#616061;">
                                Recibimos una solicitud para cambiar la contraseña de tu cuenta. Hace click en el botón para elegir una nueva.
                            </p>

                            <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                                <tr>
                                    <td align="center" bgcolor="#481a54" style="background-color:#481a54; border-radius:24px;">
                                        <a href="${reset_link}" style="display:inline-block; padding:14px 40px; border-radius:24px; font-family:'Open Sans',Arial,sans-serif; font-size:15px; font-weight:700; color:#ffffff; text-decoration:none;">
                                            Cambiar contraseña
                                        </a>
                                    </td>
                                </tr>
                            </table>

                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                                <tr>
                                    <td style="border-top:1px solid #e7e2f0; padding-top:24px;">
                                        <p style="margin:0 0 8px; font-family:'Open Sans',Arial,sans-serif; font-size:13px; line-height:1.6; color:#616061;">
                                            ¿No funciona el botón? Copia y pega este link en tu navegador:
                                        </p>
                                        <p style="margin:0; font-family:'Open Sans',Arial,sans-serif; font-size:13px; line-height:1.5; word-break:break-all;">
                                            <a href="${reset_link}" style="color:#481a54; font-weight:600; text-decoration:underline;">${reset_link}</a>
                                        </p>
                                    </td>
                                </tr>
                            </table>

                        </td>
                    </tr>

                    <tr>
                        <td align="center" style="padding:24px 8px 0;">
                            <p style="margin:0 0 6px; font-family:'Open Sans',Arial,sans-serif; font-size:12px; line-height:1.5; color:#616061;">
                                Este enlace vence en 15 minutos. Si no solicitaste cambiar tu contraseña, podes ignorar este correo.
                            </p>
                            <p style="margin:0; font-family:'Open Sans',Arial,sans-serif; font-size:12px; line-height:1.5; color:#616061;">
                                Este mensaje fue enviado automáticamente, por favor no respondas a este correo.
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

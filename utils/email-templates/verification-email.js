/* 
Plantillas HTML de los mails que envia el API
Cuando exista otro mail (p.ej. reset de password) se agrega otro archivo en esta carpeta

Reglas de los emails:
- Estilos inline: la mayoria de los clientes de mail (Gmail, Outlook) ignoran el <style> y las clases CSS
- Layout con tablas: es lo unico que se ve bien en todos los clientes
- Las imagenes no son confiables (Gmail no soporta SVG) asi que usamos texto
*/

/* 
Mail de verificacion de cuenta
Recibe el verification_link y devuelve el HTML completo
*/
export default function verificationEmail (verification_link){
    return `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Verifica tu cuenta</title>
</head>
<body style="margin:0; padding:0; background-color:#f4f1f6;">

    <!-- Contenedor exterior: centrado todo el contenido -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
            <td align="center" style="padding:40px 16px;">

                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;">

                    <!-- Wordmark de la marca -->
                    <tr>
                        <td align="center" style="padding:0 8px 24px;">
                            <span style="font-family:'Open Sans','-apple-system','Segoe UI',Arial,sans-serif; font-size:22px; font-weight:700; color:#481a54; letter-spacing:-0.5px;">
                                Slack
                            </span>
                        </td>
                    </tr>

                    <!-- Tarjeta principal -->
                    <tr>
                        <td style="background-color:#ffffff; border:1px solid #d5cfe0; border-radius:16px; padding:40px 40px 36px;">

                            <h1 style="margin:0 0 12px; font-family:'Open Sans',Arial,sans-serif; font-size:26px; line-height:1.2; font-weight:700; color:#181818;">
                                Verifica tu cuenta
                            </h1>

                            <p style="margin:0 0 28px; font-family:'Open Sans',Arial,sans-serif; font-size:15px; line-height:1.6; color:#616061;">
                                Ya casi estas listo. Hace click en el bot&oacute;n de abajo para confirmar tu email y activar tu cuenta.
                            </p>

                            <!-- Boton principal -->
                            <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                                <tr>
                                    <td align="center" bgcolor="#481a54" style="background-color:#481a54; border-radius:24px;">
                                        <a href="${verification_link}"
                                            style="display:inline-block; padding:14px 40px; border-radius:24px; font-family:'Open Sans',Arial,sans-serif; font-size:15px; font-weight:700; color:#ffffff; text-decoration:none;">
                                            Verificar cuenta
                                        </a>
                                    </td>
                                </tr>
                            </table>

                            <!-- Alternativa al boton -->
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                                <tr>
                                    <td style="border-top:1px solid #e7e2f0; padding-top:24px;">
                                        <p style="margin:0 0 8px; font-family:'Open Sans',Arial,sans-serif; font-size:13px; line-height:1.6; color:#616061;">
                                            &iquest;No funciona el bot&oacute;n? Copia y pega este link en tu navegador:
                                        </p>
                                        <p style="margin:0; font-family:'Open Sans',Arial,sans-serif; font-size:13px; line-height:1.5; word-break:break-all;">
                                            <a href="${verification_link}" style="color:#481a54; font-weight:600; text-decoration:underline;">${verification_link}</a>
                                        </p>
                                    </td>
                                </tr>
                            </table>

                        </td>
                    </tr>

                    <!-- Pie fuera de la tarjeta -->
                    <tr>
                        <td align="center" style="padding:24px 8px 0;">
                            <p style="margin:0 0 6px; font-family:'Open Sans',Arial,sans-serif; font-size:12px; line-height:1.5; color:#616061;">
                                Si no creaste esta cuenta, podes ignorar este mail y no se hara ninguna acci&oacute;n.
                            </p>
                            <p style="margin:0; font-family:'Open Sans',Arial,sans-serif; font-size:12px; line-height:1.5; color:#616061;">
                                Este mensaje fue enviado autom&aacute;ticamente, por favor no respondas a este correo.
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

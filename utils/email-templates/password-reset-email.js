import { renderLoopEmail } from './loop-email-layout.js'

/*
Plantilla HTML del correo para restablecer la contraseña en LOOP.
*/
export default function passwordResetEmail(reset_link) {
    return renderLoopEmail({
        documentTitle: 'LOOP — Restablecer contraseña',
        preheader: 'Usá este enlace para elegir una nueva contraseña en tu cuenta de LOOP.',
        badgeLabel: 'Seguridad de la cuenta',
        heading: '¿Olvidaste tu contraseña?',
        bodyText:
            'Recibimos una solicitud para restablecer la contraseña de tu cuenta en LOOP. Tocá el botón de abajo para elegir una nueva contraseña de forma segura.',
        ctaLabel: 'Restablecer contraseña',
        ctaUrl: reset_link,
        fallbackLabel: 'Restablecer mi contraseña en LOOP',
        expiryNotice:
            'Este enlace es válido por 15 minutos y puede utilizarse una sola vez.',
        footerNote:
            'Si no solicitaste cambiar tu contraseña, podés ignorar este correo y tu cuenta seguirá protegida.'
    })
}

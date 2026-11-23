import { renderLoopEmail } from './loop-email-layout.js'

/*
Plantilla HTML del correo de verificacion de cuenta de LOOP.
*/
export default function verificationEmail(verification_link) {
    return renderLoopEmail({
        documentTitle: 'LOOP — Verifica tu cuenta',
        preheader: 'Confirmá tu correo electrónico para activar tu cuenta en LOOP.',
        badgeLabel: 'Verificación de cuenta',
        heading: '¡Hola! Verificá tu cuenta en LOOP',
        bodyText:
            'Gracias por registrarte en LOOP. Para empezar a publicar, seguir personas y unirte a comunidades, confirmá tu dirección de correo electrónico tocando el botón de abajo.',
        ctaLabel: 'Verificar mi cuenta',
        ctaUrl: verification_link,
        fallbackLabel: 'Verificar mi cuenta en LOOP',
        expiryNotice: 'Este enlace es válido por 24 horas.',
        footerNote:
            'Si no creaste una cuenta en LOOP, podés ignorar este correo con tranquilidad.'
    })
}

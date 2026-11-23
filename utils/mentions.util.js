import user_repository from '../repositories/user.repository.js'

// Solo matchea @username al inicio del texto o precedido por espacio o '(', evitando emails (a@b.com)
const MENTION_REGEX = /(?:^|[\s(])@([a-z0-9._]{3,30})\b/gi

export function extractMentionUsernames(contenido = '') {
    if (typeof contenido !== 'string' || !contenido) return []

    const usernames = new Set()
    let match
    MENTION_REGEX.lastIndex = 0

    while ((match = MENTION_REGEX.exec(contenido)) !== null) {
        usernames.add(match[1].toLowerCase())
    }

    return Array.from(usernames)
}

export async function resolveMentionsFromContent(contenido = '') {
    const usernames = extractMentionUsernames(contenido)
    if (usernames.length === 0) return []

    const users = await user_repository.getActiveByUsernames(usernames)
    const seenIds = new Set()
    const resolved = []

    for (const user of users) {
        const idStr = String(user._id)
        if (seenIds.has(idStr)) continue
        seenIds.add(idStr)
        resolved.push({
            fk_id_usuario: user._id,
            username_al_mencionar: user.username
        })
    }

    return resolved
}

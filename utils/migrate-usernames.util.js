import User from '../models/user.model.js'
import { slugifyNameToUsernameBase } from './username.util.js'

export async function generateAvailableUsername(nombre) {
    const base = slugifyNameToUsernameBase(nombre)
    let candidate = base
    let counter = 1

    while (await User.exists({ username: candidate })) {
        const suffix = String(counter)
        candidate = `${base.slice(0, 30 - suffix.length)}${suffix}`
        counter += 1
    }

    return candidate
}

export async function migrateMissingUsernames() {
    const usersWithoutUsername = await User.find({
        $or: [
            { username: { $exists: false } },
            { username: null },
            { username: '' }
        ]
    }).select('_id nombre username')

    const migrated = []

    for (const user of usersWithoutUsername) {
        const assigned = await generateAvailableUsername(user.nombre)
        await User.updateOne(
            { _id: user._id },
            { $set: { username: assigned } }
        )
        migrated.push({ _id: String(user._id), nombre: user.nombre, username: assigned })
    }

    await User.syncIndexes()

    return migrated
}

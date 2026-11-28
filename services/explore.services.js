import explore_repository from "../repositories/explore.repository.js"
import follow_repository from "../repositories/follow.repository.js"

const TRENDING_WINDOW_DAYS = 7
const TRENDING_WINDOW_MS = TRENDING_WINDOW_DAYS * 24 * 60 * 60 * 1000
const DEFAULT_TRENDING_LIMIT = 15
const MAX_TRENDING_LIMIT = 20
const DEFAULT_FOR_YOU_LIMIT = 15
const MAX_FOR_YOU_LIMIT = 20
const TRENDING_GRAVITY = 1.2
const TRENDING_AGE_OFFSET_HOURS = 2

export function computeTrendingScore({
    likes = 0,
    comments = 0,
    reposts = 0,
    ageHours = 0
} = {}) {
    const safeAge = Math.max(0, Number(ageHours) || 0)
    const rawPoints =
        (Number(likes) || 0) * 1 +
        (Number(comments) || 0) * 2 +
        (Number(reposts) || 0) * 2

    return rawPoints / Math.pow(safeAge + TRENDING_AGE_OFFSET_HOURS, TRENDING_GRAVITY)
}

async function getTrendingPosts({ page = 1, limit = DEFAULT_TRENDING_LIMIT } = {}) {
    const parsedPage = Number.parseInt(page, 10)
    const safePage = Number.isFinite(parsedPage) && parsedPage >= 1 ? parsedPage : 1

    const parsedLimit = Number.parseInt(limit, 10)
    const safeLimit = Number.isFinite(parsedLimit) && parsedLimit >= 1
        ? Math.min(parsedLimit, MAX_TRENDING_LIMIT)
        : DEFAULT_TRENDING_LIMIT

    const now_date = new Date()
    const since_date = new Date(now_date.getTime() - TRENDING_WINDOW_MS)

    return await explore_repository.getTrendingPosts({
        since_date,
        now_date,
        page: safePage,
        limit: safeLimit,
        gravity: TRENDING_GRAVITY,
        age_offset_hours: TRENDING_AGE_OFFSET_HOURS
    })
}

async function getForYouPosts(requester_id, { page = 1, limit = DEFAULT_FOR_YOU_LIMIT } = {}) {
    const parsedPage = Number.parseInt(page, 10)
    const safePage = Number.isFinite(parsedPage) && parsedPage >= 1 ? parsedPage : 1

    const parsedLimit = Number.parseInt(limit, 10)
    const safeLimit = Number.isFinite(parsedLimit) && parsedLimit >= 1
        ? Math.min(parsedLimit, MAX_FOR_YOU_LIMIT)
        : DEFAULT_FOR_YOU_LIMIT

    const followingDocs = await follow_repository.getFollowingByUserId(requester_id)
    const followed_user_ids = followingDocs
        .map((doc) => doc.fk_id_seguido?._id || doc.fk_id_seguido)
        .filter(Boolean)

    return await explore_repository.getForYouPosts({
        exclude_user_id: requester_id,
        followed_user_ids,
        page: safePage,
        limit: safeLimit
    })
}

const explore_service = {
    getTrendingPosts,
    getForYouPosts,
    computeTrendingScore
}

export default explore_service

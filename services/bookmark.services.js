import mongoose from "mongoose"
import bookmark_repository from "../repositories/bookmark.repository.js"
import post_repository from "../repositories/post.repository.js"
import like_repository from "../repositories/like.repository.js"
import comment_repository from "../repositories/comment.repository.js"
import repost_repository from "../repositories/repost.repository.js"
import ServerError from "../utils/error.util.js"

const DEFAULT_PAGE = 1
const DEFAULT_LIMIT = 20
const MAX_LIMIT = 50

function normalizePagination(query = {}) {
    const rawPage = Number(query.page)
    const rawLimit = Number(query.limit)

    const page = Number.isInteger(rawPage) && rawPage > 0 ? rawPage : DEFAULT_PAGE
    const limit = Number.isInteger(rawLimit) && rawLimit > 0
        ? Math.min(rawLimit, MAX_LIMIT)
        : DEFAULT_LIMIT

    return { page, limit }
}

async function bookmarkPost(user_id, post_id) {
    if (!mongoose.Types.ObjectId.isValid(post_id)) {
        throw new ServerError("ID de publicacion invalido", 400)
    }

    const post = await post_repository.getById(post_id)

    if (!post || !post.activo) {
        throw new ServerError("Publicacion no encontrada", 404)
    }

    const existing = await bookmark_repository.getByUserAndPost(user_id, post_id)

    if (existing) {
        return {
            bookmarked: true,
            already_bookmarked: true,
            bookmark_id: existing._id
        }
    }

    try {
        const created = await bookmark_repository.create(user_id, post_id)
        return {
            bookmarked: true,
            already_bookmarked: false,
            bookmark_id: created._id
        }
    } catch (error) {
        if (error?.code === 11000) {
            const concurrent = await bookmark_repository.getByUserAndPost(user_id, post_id)
            return {
                bookmarked: true,
                already_bookmarked: true,
                bookmark_id: concurrent?._id || null
            }
        }
        throw error
    }
}

async function unbookmarkPost(user_id, post_id) {
    if (!mongoose.Types.ObjectId.isValid(post_id)) {
        throw new ServerError("ID de publicacion invalido", 400)
    }

    const deleted = await bookmark_repository.deleteByUserAndPost(user_id, post_id)

    return {
        bookmarked: false,
        removed: Boolean(deleted)
    }
}

async function getMyBookmarks(user_id, query = {}) {
    const { page, limit } = normalizePagination(query)
    const { bookmarks, total } = await bookmark_repository.getByUserIdPaginated(user_id, page, limit)

    const post_ids = bookmarks.map((item) => item.fk_id_publicacion._id)

    const [likesSummary, commentsCountMap, repostsSummary] = await Promise.all([
        like_repository.getSummaryByPostIds(post_ids, user_id),
        comment_repository.countByPostIds(post_ids),
        repost_repository.getSummaryByPostIds(post_ids, user_id)
    ])

    const hydrated = bookmarks.map((item) => {
        const postObj = item.fk_id_publicacion.toObject
            ? item.fk_id_publicacion.toObject()
            : { ...item.fk_id_publicacion }
        const postKey = String(postObj._id)
        const likeInfo = likesSummary.get(postKey) || { likes_count: 0, is_liked: false }
        const repostInfo = repostsSummary.get(postKey) || { reposts_count: 0, is_reposted: false, latest_repost_user: null }

        return {
            _id: item._id,
            fecha_guardado: item.fecha_creacion,
            post: {
                ...postObj,
                likes_count: likeInfo.likes_count,
                is_liked: likeInfo.is_liked,
                comments_count: commentsCountMap.get(postKey) || 0,
                reposts_count: repostInfo.reposts_count,
                is_reposted: repostInfo.is_reposted,
                latest_repost_user: repostInfo.latest_repost_user,
                is_bookmarked: true
            }
        }
    })

    return {
        bookmarks: hydrated,
        pagination: {
            page,
            limit,
            total,
            has_more: page * limit < total
        }
    }
}

const bookmark_service = {
    bookmarkPost,
    unbookmarkPost,
    getMyBookmarks
}

export default bookmark_service

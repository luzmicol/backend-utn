import Post from "../models/post.model.js"
import Like from "../models/like.model.js"
import Comment from "../models/comment.model.js"
import Repost from "../models/repost.model.js"

const MS_PER_HOUR = 3600000

class ExploreRepository {
    async getTrendingPosts({
        since_date,
        now_date = new Date(),
        page = 1,
        limit = 15,
        gravity = 1.2,
        age_offset_hours = 2
    }) {
        const safePage = Math.max(Number.parseInt(page, 10) || 1, 1)
        const safeLimit = Math.min(Math.max(Number.parseInt(limit, 10) || 15, 1), 20)
        const skip = (safePage - 1) * safeLimit

        const likesCollection = Like.collection.name
        const commentsCollection = Comment.collection.name
        const repostsCollection = Repost.collection.name

        const pipeline = [
            {
                $match: {
                    activo: true,
                    fecha_creacion: { $gte: since_date }
                }
            },
            {
                $lookup: {
                    from: likesCollection,
                    let: { postId: '$_id' },
                    pipeline: [
                        { $match: { $expr: { $eq: ['$fk_id_publicacion', '$$postId'] } } },
                        { $count: 'count' }
                    ],
                    as: '_likes_agg'
                }
            },
            {
                $lookup: {
                    from: commentsCollection,
                    let: { postId: '$_id' },
                    pipeline: [
                        {
                            $match: {
                                $expr: { $eq: ['$fk_id_publicacion', '$$postId'] },
                                activo: true
                            }
                        },
                        { $count: 'count' }
                    ],
                    as: '_comments_agg'
                }
            },
            {
                $lookup: {
                    from: repostsCollection,
                    let: { postId: '$_id' },
                    pipeline: [
                        { $match: { $expr: { $eq: ['$fk_id_publicacion', '$$postId'] } } },
                        { $count: 'count' }
                    ],
                    as: '_reposts_agg'
                }
            },
            {
                $addFields: {
                    likes_count: {
                        $ifNull: [{ $arrayElemAt: ['$_likes_agg.count', 0] }, 0]
                    },
                    comments_count: {
                        $ifNull: [{ $arrayElemAt: ['$_comments_agg.count', 0] }, 0]
                    },
                    reposts_count: {
                        $ifNull: [{ $arrayElemAt: ['$_reposts_agg.count', 0] }, 0]
                    },
                    _age_hours: {
                        $max: [
                            0,
                            {
                                $divide: [
                                    { $subtract: [now_date, '$fecha_creacion'] },
                                    MS_PER_HOUR
                                ]
                            }
                        ]
                    }
                }
            },
            {
                $addFields: {
                    trending_score: {
                        $divide: [
                            {
                                $add: [
                                    '$likes_count',
                                    { $multiply: ['$comments_count', 2] },
                                    { $multiply: ['$reposts_count', 2] }
                                ]
                            },
                            {
                                $pow: [
                                    { $add: ['$_age_hours', age_offset_hours] },
                                    gravity
                                ]
                            }
                        ]
                    }
                }
            },
            {
                $sort: {
                    trending_score: -1,
                    fecha_creacion: -1,
                    _id: -1
                }
            },
            {
                $project: {
                    _likes_agg: 0,
                    _comments_agg: 0,
                    _reposts_agg: 0,
                    _age_hours: 0
                }
            },
            {
                $facet: {
                    metadata: [{ $count: 'total' }],
                    items: [{ $skip: skip }, { $limit: safeLimit }]
                }
            }
        ]

        const [aggregated] = await Post.aggregate(pipeline)
        const total = aggregated?.metadata?.[0]?.total ?? 0
        const rawItems = aggregated?.items ?? []

        const populatedPosts = await Post.populate(rawItems, [
            { path: 'fk_id_usuario', select: 'nombre username avatar_url' },
            { path: 'fk_id_comunidad', select: 'nombre' },
            { path: 'menciones.fk_id_usuario', select: 'nombre username avatar_url' }
        ])

        return {
            posts: populatedPosts,
            pagination: {
                page: safePage,
                limit: safeLimit,
                total,
                has_more: skip + populatedPosts.length < total
            }
        }
    }

    async getForYouPosts({
        exclude_user_id,
        followed_user_ids = [],
        page = 1,
        limit = 15
    }) {
        const safePage = Math.max(Number.parseInt(page, 10) || 1, 1)
        const safeLimit = Math.min(Math.max(Number.parseInt(limit, 10) || 15, 1), 20)
        const skip = (safePage - 1) * safeLimit

        const excludedAuthors = [exclude_user_id, ...followed_user_ids].filter(Boolean)
        const discoveryFilter = {
            activo: true,
            fk_id_usuario: { $nin: excludedAuthors }
        }

        const [posts, total] = await Promise.all([
            Post.find(discoveryFilter)
                .sort({ fecha_creacion: -1, _id: -1 })
                .skip(skip)
                .limit(safeLimit)
                .populate('fk_id_usuario', 'nombre username avatar_url')
                .populate('fk_id_comunidad', 'nombre')
                .populate('menciones.fk_id_usuario', 'nombre username avatar_url'),
            Post.countDocuments(discoveryFilter)
        ])

        return {
            posts,
            pagination: {
                page: safePage,
                limit: safeLimit,
                total,
                has_more: skip + posts.length < total
            }
        }
    }
}

const explore_repository = new ExploreRepository()

export default explore_repository

import express from 'express'
import authMiddleware from '../middlewares/auth.middleware.js'
import { getTrending, getForYou } from '../controllers/explore.controller.js'

const explore_router = express.Router()

explore_router.use(authMiddleware)

/**
 * @openapi
 * /api/explore/trending:
 *   get:
 *     summary: Obtiene publicaciones en tendencia de los ultimos 7 dias ordenadas por actividad reciente
 *     tags: [Explore]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 15
 *           maximum: 20
 *     responses:
 *       '200':
 *         description: Publicaciones en tendencia obtenidas correctamente
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 */
explore_router.get('/trending', getTrending)

/**
 * @openapi
 * /api/explore/for-you:
 *   get:
 *     summary: Obtiene publicaciones recomendadas para descubrir cuentas y comunidades nuevas
 *     tags: [Explore]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 5
 *           maximum: 15
 *     responses:
 *       '200':
 *         description: Recomendaciones obtenidas correctamente
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 */
explore_router.get('/for-you', getForYou)

export default explore_router

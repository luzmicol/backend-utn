import { del, put } from '@vercel/blob'
import sharp from 'sharp'
import ENVIRONMENT from '../config/environment.config.js'
import ServerError from '../utils/error.util.js'

const ALLOWED_IMAGE_FORMATS = ['jpeg', 'png', 'webp']
const TARGET_MAX_DIMENSION = 512
const TARGET_SOFT_BYTES = 150 * 1024

function getBlobToken() {
    return process.env.BLOB_READ_WRITE_TOKEN || ENVIRONMENT.BLOB_READ_WRITE_TOKEN || ''
}

async function validateAndOptimizeImage(buffer, { maxDimension = TARGET_MAX_DIMENSION } = {}) {
    if (!buffer || !Buffer.isBuffer(buffer) || buffer.length === 0) {
        throw new ServerError('El archivo de imagen es requerido', 400)
    }

    let metadata
    try {
        metadata = await sharp(buffer).metadata()
    } catch {
        throw new ServerError('El archivo no es una imagen valida', 400)
    }

    if (!metadata?.format || !ALLOWED_IMAGE_FORMATS.includes(metadata.format)) {
        throw new ServerError('Formato de imagen no permitido. Solo JPG, PNG o WebP', 400)
    }

    const basePipeline = () =>
        sharp(buffer)
            .rotate()
            .resize(maxDimension, maxDimension, {
                fit: 'inside',
                withoutEnlargement: true
            })

    let optimized = await basePipeline().webp({ quality: 80 }).toBuffer()

    if (optimized.length > TARGET_SOFT_BYTES) {
        optimized = await basePipeline().webp({ quality: 68 }).toBuffer()
    }

    return optimized
}

async function uploadImage(buffer, { folder = 'uploads', filenamePrefix = 'img', maxDimension = TARGET_MAX_DIMENSION } = {}) {
    const token = getBlobToken()
    if (!token) {
        throw new ServerError('El almacenamiento de imagenes no esta configurado', 503)
    }

    const optimizedBuffer = await validateAndOptimizeImage(buffer, { maxDimension })
    const safePrefix = String(filenamePrefix).replace(/[^a-zA-Z0-9_-]/g, '')
    const pathname = `${folder}/${safePrefix}-${Date.now()}.webp`

    try {
        const blob = await put(pathname, optimizedBuffer, {
            access: 'public',
            contentType: 'image/webp',
            addRandomSuffix: true,
            token
        })

        return {
            url: blob.url,
            size: optimizedBuffer.length
        }
    } catch (error) {
        console.error('[Storage] Error subiendo imagen a Vercel Blob:', error?.message || 'unknown')
        throw new ServerError('No se pudo almacenar la imagen', 502)
    }
}

async function deleteImageByUrl(url) {
    if (!url || typeof url !== 'string') {
        return false
    }

    const token = getBlobToken()
    if (!token) {
        return false
    }

    try {
        await del(url, { token })
        return true
    } catch (error) {
        console.error('[Storage] Error eliminando imagen previa de Vercel Blob:', error?.message || 'unknown')
        return false
    }
}

const storage_service = {
    validateAndOptimizeImage,
    uploadImage,
    deleteImageByUrl
}

export default storage_service

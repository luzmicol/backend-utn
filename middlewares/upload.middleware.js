import multer from 'multer'
import ServerError from '../utils/error.util.js'

const MAX_INPUT_IMAGE_BYTES = 10 * 1024 * 1024 // 10 MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp']

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: MAX_INPUT_IMAGE_BYTES,
        files: 1
    },
    fileFilter: (_request, file, callback) => {
        if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
            return callback(
                new ServerError('Formato de imagen no permitido. Solo JPG, PNG o WebP', 400)
            )
        }
        callback(null, true)
    }
})

export function uploadSingleImage(fieldName) {
    const handler = upload.single(fieldName)

    return (request, response, next) => {
        handler(request, response, (error) => {
            if (!error) {
                return next()
            }

            if (error instanceof multer.MulterError) {
                if (error.code === 'LIMIT_FILE_SIZE') {
                    return next(new ServerError('La imagen no puede superar los 10 MB', 400))
                }
                return next(new ServerError('Error al procesar el archivo subido', 400))
            }

            return next(error)
        })
    }
}

export function uploadOptionalSingleImage(fieldName, { maxBytes = 5 * 1024 * 1024 } = {}) {
    const customUpload = multer({
        storage: multer.memoryStorage(),
        limits: {
            fileSize: maxBytes,
            files: 1
        },
        fileFilter: (_request, file, callback) => {
            if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
                return callback(
                    new ServerError('Formato de imagen no permitido. Solo JPG, PNG o WebP', 400)
                )
            }
            callback(null, true)
        }
    }).single(fieldName)

    return (request, response, next) => {
        const contentType = request.headers['content-type'] || ''
        if (!contentType.includes('multipart/form-data')) {
            return next()
        }

        customUpload(request, response, (error) => {
            if (!error) {
                return next()
            }

            if (error instanceof multer.MulterError) {
                if (error.code === 'LIMIT_FILE_SIZE') {
                    const maxMb = Math.round(maxBytes / (1024 * 1024))
                    return next(new ServerError(`La imagen no puede superar los ${maxMb} MB`, 400))
                }
                if (error.code === 'LIMIT_UNEXPECTED_FILE' || error.code === 'LIMIT_FILE_COUNT') {
                    return next(new ServerError('Solo se permite una unica imagen por publicacion', 400))
                }
                return next(new ServerError('Error al procesar el archivo subido', 400))
            }

            return next(error)
        })
    }
}

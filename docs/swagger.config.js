/* 
Configuracion central de la documentacion OpenAPI (Swagger)

Aqui se define la base del spec: info, servers, tags y todos los components
reutilizables (schemas, respuestas de error, parametros y seguridad).

La documentacion de CADA endpoint vive como comentarios JSDoc con @openapi
en su archivo de ruta correspondiente (../routes/*.router.js).
swagger-jsdoc une esta base + esos comentarios y genera el spec final
que se sirve en /api/docs (UI) y /api/docs.json (JSON crudo).
*/

/* 
Necesario para que swagger-jsdoc encuentre las rutas tanto en local
como en Vercel: resolvemos las rutas de los archivos relativos a ESTE archivo
*/
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/* 
Forma que respetan TODAS las respuestas de la API:
- Exito:   { ok, status, message, data: {...} }
- Error:   { ok: false, status, message }
*/

const openapi_base = {

    openapi: '3.0.3',

    info: {
        title: 'LOOP Backend API',
        version: '1.0.0',
        description: `
API REST de **LOOP**, red social Full Stack (Trabajo Integrador Final UTN): autenticación con verificación de email, perfiles públicos, publicaciones, comunidades, mensajería privada y notificaciones.

**Formato de respuestas**

Todas las respuestas (de exito y de error) respetan la misma estructura:

- Exito: \`{ ok: true, status, message, data: {...} }\`
- Error: \`{ ok: false, status, message }\`

**Autenticacion**

Los endpoints privados esperan el header \`Authorization: Bearer <authentication_token>\`,
donde el token es el JWT que devuelve \`POST /api/auth/login\`.

**Errores globales**

- \`500\` Internal server error: error inesperado no controlado (posible en cualquier endpoint)
- \`503\` No se pudo conectar a la base de datos: aplica a TODOS los endpoints porque
la conexion a MongoDB se abre en un middleware global antes de cada request
        `
    },

    servers: [
        {
            url: 'http://localhost:8080',
            description: 'Servidor local de desarrollo'
        },
        {
            url: 'https://backend-utn-seven.vercel.app',
            description: 'Servidor de produccion (Vercel)'
        }
    ],

    tags: [
        {
            name: 'Auth',
            description: 'Registro, login, verificacion de email y recuperacion de contraseña'
        },
        {
            name: 'Users',
            description: 'Perfiles publicos, avatares, usernames y seguidores'
        },
        {
            name: 'Conversations',
            description: 'Conversaciones privadas 1-a-1 y estado de lectura'
        },
        {
            name: 'Messages',
            description: 'Gestion de mensajes privados'
        },
        {
            name: 'Notifications',
            description: 'Notificaciones de actividad en LOOP'
        },
        {
            name: 'Posts',
            description: 'Publicaciones del feed de LOOP'
        },
        {
            name: 'Likes',
            description: 'Me gusta en publicaciones de LOOP'
        },
        {
            name: 'Reposts',
            description: 'Reposts de publicaciones en LOOP'
        },
        {
            name: 'Comments',
            description: 'Comentarios en publicaciones de LOOP'
        },
        {
            name: 'Communities',
            description: 'Comunidades publicas y membresias de LOOP'
        },
        {
            name: 'Follows',
            description: 'Seguimiento entre usuarios de LOOP'
        },
        {
            name: 'System',
            description: 'Endpoints tecnicos de integracion protegidos con API Key'
        }
    ],

    components: {

        securitySchemes: {
            bearerAuth: {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT',
                description: 'JWT devuelto por POST /api/auth/login (expira en 1 dia). Enviar como: Authorization: Bearer <token>'
            },
            apiKeyAuth: {
                type: 'apiKey',
                in: 'header',
                name: 'x-api-key',
                description: 'API Key tecnica configurada en la variable de entorno API_KEY'
            }
        },

        parameters: {

            user_id: {
                name: 'user_id',
                in: 'path',
                required: true,
                description: 'ObjectId del usuario en MongoDB',
                schema: {
                    type: 'string',
                    pattern: '^[0-9a-fA-F]{24}$',
                    example: '691f2a1b8c9d3e4f5a6b7c8d'
                }
            },

            workspace_id: {
                name: 'workspace_id',
                in: 'path',
                required: true,
                description: 'ObjectId del espacio de trabajo en MongoDB',
                schema: {
                    type: 'string',
                    pattern: '^[0-9a-fA-F]{24}$',
                    example: '691f2a1b8c9d3e4f5a6b7c8d'
                }
            }
        },

        schemas: {

            /* ----------------------------- ERRORES ----------------------------- */

            ErrorResponse: {
                type: 'object',
                properties: {
                    ok: {
                        type: 'boolean',
                        example: false
                    },
                    status: {
                        type: 'integer',
                        description: 'Codigo HTTP del error',
                        example: 400
                    },
                    message: {
                        type: 'string',
                        description: 'Descripcion del error en ingles/espaniol segun el caso',
                        example: 'Email is incorrect'
                    },
                    code: {
                        type: 'string',
                        description: 'Codigo OPCIONAL del error. Permite al cliente reaccionar sin parsear el message (ej: RESET_TOKEN_EXPIRED, TOO_MANY_REQUESTS). Solo aparece en algunos endpoints',
                        example: 'RESET_TOKEN_EXPIRED'
                    }
                },
                required: ['ok', 'status', 'message']
            },

            /* ------------------------------ USUARIO ---------------------------- */

            UserPublic: {
                type: 'object',
                description: 'Usuario en formato publico: SIN el hash de password',
                properties: {
                    _id: {
                        type: 'string',
                        example: '691f2a1b8c9d3e4f5a6b7c8d'
                    },
                    nombre: {
                        type: 'string',
                        example: 'Juan Perez'
                    },
                    email: {
                        type: 'string',
                        format: 'email',
                        example: 'juan.perez@mail.com'
                    },
                    fecha_creacion: {
                        type: 'string',
                        format: 'date-time',
                        example: '2026-11-17T12:00:00.000Z'
                    },
                    activo: {
                        type: 'boolean',
                        description: 'Baja logica del usuario',
                        example: true
                    },
                    email_verificado: {
                        type: 'boolean',
                        example: true
                    }
                },
                required: ['_id', 'nombre', 'email']
            },

            /* --------------------------- ESPACIO TRABAJO ------------------------ */

            Workspace: {
                type: 'object',
                properties: {
                    _id: {
                        type: 'string',
                        example: '691f2a1b8c9d3e4f5a6b7c8d'
                    },
                    nombre: {
                        type: 'string',
                        maxLength: 30,
                        example: 'Proyecto UTN'
                    },
                    description: {
                        type: 'string',
                        maxLength: 1000,
                        example: 'Espacio de trabajo de la materia backend'
                    },
                    fecha_creacion: {
                        type: 'string',
                        format: 'date-time',
                        example: '2026-11-17T12:00:00.000Z'
                    }
                },
                required: ['_id', 'nombre']
            },

            /* Miembro tal como lo devuelve GET /api/workspaces/{workspace_id}/members:
            membresia con los datos del usuario poblados (solo nombre) */
            MemberWithUser: {
                type: 'object',
                description: 'Membresia de un usuario en un espacio de trabajo, con el nombre del usuario poblado',
                properties: {
                    _id: {
                        type: 'string',
                        example: '692f2a1b8c9d3e4f5a6b7c8d'
                    },
                    fk_id_usuario: {
                        type: 'object',
                        properties: {
                            _id: {
                                type: 'string',
                                example: '691f2a1b8c9d3e4f5a6b7c8d'
                            },
                            nombre: {
                                type: 'string',
                                example: 'Juan Perez'
                            }
                        },
                        required: ['_id', 'nombre']
                    },
                    fk_id_espacio_trabajo: {
                        type: 'string',
                        description: 'ObjectId del espacio de trabajo',
                        example: '691f2a1b8c9d3e4f5a6b7c8d'
                    },
                    rol: {
                        type: 'string',
                        enum: ['user', 'admin', 'owner'],
                        example: 'owner'
                    },
                    fecha_creacion: {
                        type: 'string',
                        format: 'date-time',
                        example: '2026-11-17T12:00:00.000Z'
                    }
                },
                required: ['_id', 'fk_id_usuario', 'fk_id_espacio_trabajo', 'rol']
            },

            /* Miembro resumido tal como lo devuelve GET /api/workspaces:
            solo nombre y rol */
            MemberSummary: {
                type: 'object',
                properties: {
                    nombre: {
                        type: 'string',
                        example: 'Juan Perez'
                    },
                    rol: {
                        type: 'string',
                        enum: ['user', 'admin', 'owner'],
                        example: 'owner'
                    }
                },
                required: ['nombre', 'rol']
            },

            /* Espacio de trabajo con su lista de miembros, tal como lo
            devuelve GET /api/workspaces */
            WorkspaceWithMembers: {
                type: 'object',
                properties: {
                    _id: {
                        type: 'string',
                        example: '691f2a1b8c9d3e4f5a6b7c8d'
                    },
                    nombre: {
                        type: 'string',
                        example: 'Proyecto UTN'
                    },
                    fecha_creacion: {
                        type: 'string',
                        format: 'date-time',
                        example: '2026-11-17T12:00:00.000Z'
                    },
                    members: {
                        type: 'array',
                        items: {
                            $ref: '#/components/schemas/MemberSummary'
                        }
                    }
                },
                required: ['_id', 'nombre', 'members']
            },

            /* ------------------------- BODIES DE ENTRADA ------------------------ */

            RegisterRequest: {
                type: 'object',
                properties: {
                    username: {
                        type: 'string',
                        description: 'Nombre del usuario',
                        example: 'Juan Perez'
                    },
                    email: {
                        type: 'string',
                        format: 'email',
                        example: 'juan.perez@mail.com'
                    },
                    password: {
                        type: 'string',
                        format: 'password',
                        description: 'Se guarda en DB como hash (bcrypt), nunca en texto plano',
                        example: 'MiContraseNia123'
                    }
                },
                required: ['username', 'email', 'password']
            },

            LoginRequest: {
                type: 'object',
                properties: {
                    email: {
                        type: 'string',
                        format: 'email',
                        example: 'juan.perez@mail.com'
                    },
                    password: {
                        type: 'string',
                        format: 'password',
                        example: 'MiContraseNia123'
                    }
                },
                required: ['email', 'password']
            },

            VerifyRequest: {
                type: 'object',
                properties: {
                    verification_token: {
                        type: 'string',
                        description: 'Token recibido en el link del mail de verificacion (firmado en el register)',
                        example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
                    }
                },
                required: ['verification_token']
            },

            CreateWorkspaceRequest: {
                type: 'object',
                properties: {
                    name: {
                        type: 'string',
                        maxLength: 30,
                        description: 'Nombre del espacio de trabajo (requerido)',
                        example: 'Proyecto UTN'
                    },
                    description: {
                        type: 'string',
                        maxLength: 1000,
                        description: 'Descripcion del espacio de trabajo (opcional)',
                        example: 'Espacio de trabajo de la materia backend'
                    }
                },
                required: ['name']
            },

            UpdateWorkspaceRequest: {
                type: 'object',
                description: 'Campos opcionales: se envian solo los que se quieran actualizar',
                properties: {
                    name: {
                        type: 'string',
                        maxLength: 30,
                        description: 'Nuevo nombre del espacio de trabajo (opcional)',
                        example: 'Proyecto UTN 2.0'
                    },
                    description: {
                        type: 'string',
                        maxLength: 1000,
                        description: 'Nueva descripcion del espacio de trabajo (opcional; vacia para borrarla)',
                        example: 'Descripcion actualizada del espacio'
                    }
                }
            }
        },

        responses: {

            /* ------------------------- ERRORES REUTILIZABLES ------------------- */

            BadRequest: {
                description: 'Datos de entrada invalidos (campo faltante, formato incorrecto, valor ya usado, etc). El detalle llega en message',
                content: {
                    'application/json': {
                        schema: {
                            $ref: '#/components/schemas/ErrorResponse'
                        },
                        examples: {
                            campo_requerido: {
                                summary: 'Campo requerido faltante',
                                value: { ok: false, status: 400, message: 'Email, password and username is required' }
                            },
                            email_invalido: {
                                summary: 'Email con formato incorrecto',
                                value: { ok: false, status: 400, message: 'Email is incorrect' }
                            }
                        }
                    }
                }
            },

            Unauthorized: {
                description: 'Token de autenticacion ausente, malformado, invalido o expirado',
                content: {
                    'application/json': {
                        schema: {
                            $ref: '#/components/schemas/ErrorResponse'
                        },
                        examples: {
                            header_ausente: {
                                summary: 'Sin header Authorization',
                                value: { ok: false, status: 400, message: 'Auth header is requered' }
                            },
                            header_malformado: {
                                summary: 'Header Authorization sin el token',
                                value: { ok: false, status: 400, message: 'Auth header is malformed' }
                            },
                            token_invalido: {
                                summary: 'Token invalido, malformado o expirado',
                                value: { ok: false, status: 401, message: 'Auth token is invalid!' }
                            }
                        }
                    }
                }
            },

            Forbidden: {
                description: 'El usuario autenticado no tiene permisos sobre el recurso',
                content: {
                    'application/json': {
                        schema: {
                            $ref: '#/components/schemas/ErrorResponse'
                        },
                        examples: {
                            no_miembro: {
                                summary: 'No es miembro del espacio de trabajo',
                                value: { ok: false, status: 403, message: 'No eres miembro de este espacio de trabajo' }
                            },
                            sin_rol: {
                                summary: 'Su rol no alcanza para la operacion',
                                value: { ok: false, status: 403, message: 'No tienes permisos suficientes para hacer esta operacion' }
                            }
                        }
                    }
                }
            },

            NotFound: {
                description: 'El recurso solicitado no existe',
                content: {
                    'application/json': {
                        schema: {
                            $ref: '#/components/schemas/ErrorResponse'
                        },
                        examples: {
                            no_encontrado: {
                                summary: 'Recurso no encontrado',
                                value: { ok: false, status: 404, message: 'User not found' }
                            }
                        }
                    }
                }
            },

            InternalError: {
                description: 'Error inesperado no controlado por la API',
                content: {
                    'application/json': {
                        schema: {
                            $ref: '#/components/schemas/ErrorResponse'
                        },
                        example: { ok: false, status: 500, message: 'Internal server error' }
                    }
                }
            },

            ServiceUnavailable: {
                description: 'La API no pudo conectarse a MongoDB (middleware global previo a cada request)',
                content: {
                    'application/json': {
                        schema: {
                            $ref: '#/components/schemas/ErrorResponse'
                        },
                        example: { ok: false, status: 503, message: 'No se pudo conectar a la base de datos' }
                    }
                }
            },

            TooManyRequests: {
                description: 'Se supero el limite de solicitudes en la ventana de tiempo (rate limit). En /api/auth/forgot-password: 5 cada 15 minutos por IP',
                content: {
                    'application/json': {
                        schema: {
                            $ref: '#/components/schemas/ErrorResponse'
                        },
                        example: { ok: false, status: 429, message: 'Too many requests, please try again later', code: 'TOO_MANY_REQUESTS' }
                    }
                }
            }
        }
    }
}

/* 
Opciones para swagger-jsdoc:
- definition: base del spec (este objeto)
- apis: archivos donde buscar comentarios JSDoc con @openapi
*/
const swagger_options = {
    definition: openapi_base,
    apis: [
        path.join(__dirname, '..', 'main.js'),
        path.join(__dirname, '..', 'routes', 'auth.router.js'),
        path.join(__dirname, '..', 'routes', 'user.router.js'),
        path.join(__dirname, '..', 'routes', 'post.router.js'),
        path.join(__dirname, '..', 'routes', 'community.router.js'),
        path.join(__dirname, '..', 'routes', 'conversation.router.js'),
        path.join(__dirname, '..', 'routes', 'message.router.js'),
        path.join(__dirname, '..', 'routes', 'notification.router.js')
    ]
}

export default swagger_options

import cors from 'cors'
import { isProduction } from '@clyde-api/utils/env'

const allowedOrigins = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)

export default () =>
  cors({
    origin: (origin, callback) => {
      // Development: allow all origins (echoes back Origin header, compatible with credentials)
      if (!isProduction) return callback(null, true)

      // Production: strict allowlist from CORS_ORIGINS
      if (!origin) return callback(null, true) // allow non-browser requests (curl, server-to-server)

      if (allowedOrigins.includes(origin)) {
        callback(null, true)
      } else {
        callback(new Error(`CORS: Origin ${origin} not allowed`), false)
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })

export const useCors = process.env.USE_CORS === 'true'

import express, { json, urlencoded, Request, Response, NextFunction } from 'express'
import helmet from 'helmet'

import api from '@clyde-api/server/routers'

import morgan from '@clyde-api/utils/morgan'
import cors, { useCors } from '@clyde-api/utils/cors'
import { attachRequestId } from '@clyde-api/server/middleware/requestId'
import logger from '@clyde-api/utils/logger'

const app = express()

// Trust Render's single load-balancer hop so req.protocol === 'https' and
// req.ip reflects the real client address rather than the proxy IP.
app.set('trust proxy', 1)

const getStatusCode = (err: any): number => {
  if (err.statusCode || err.status) return err.statusCode || err.status

  switch (err.code) {
    case 'missing_param':
    case 'validation_error':
    case 'bad_request':
      return 400
    case 'unauthorized':
      return 401
    case 'forbidden':
      return 403
    case 'not_found':
      return 404
    case 'conflict':
      return 409
    case 'rate_limited':
      return 429
    default:
      return 500
  }
}

// Basic
// `verify` keeps the exact request bytes: webhook providers sign the raw body, and re-serializing the
// parsed JSON does not reproduce it.
app.use(
  json({
    limit: '5mb',
    verify: (req, _res, buf) => {
      ;(req as Request).rawBody = buf
    },
  }),
)
app.use(urlencoded({ extended: true, limit: '5mb' }))
app.use(
  helmet({
    hsts: {
      // 180 days — long enough to provide protection, short enough to recover
      // from a misconfiguration without months of browser lockout.
      // Bump to 31536000 (1 year) once confirmed stable in production.
      maxAge: 15552000,
      includeSubDomains: true,
      // preload intentionally omitted — requires HSTS Preload List submission
      // and cannot be easily rolled back. Add after the 180-day window is proven.
    },
  }),
)
app.use(attachRequestId)
app.use(morgan())

if (useCors) app.use(cors())

app.use(api)

// Global error handler - must be AFTER routes
app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
  const statusCode = getStatusCode(err)
  const isClientError = statusCode >= 400 && statusCode < 500
  const isServerError = statusCode >= 500

  const errorContext = {
    requestId: req.context?.requestId,
    method: req.method,
    path: req.path,
    statusCode,
    errorCode: err.code,
    message: err.message,
    stack: err.stack,
    ip: req.ip,
    userAgent: req.get('user-agent'),
    ...(err.meta || {}),
  }

  if (isServerError) {
    logger.error('[GlobalErrorHandler] 5xx error', errorContext)
  } else if (isClientError) {
    logger.warn('[GlobalErrorHandler] 4xx error', errorContext)
  } else {
    logger.info('[GlobalErrorHandler] Non-standard error', errorContext)
  }

  res.status(statusCode).json({
    error: err.message || 'Internal Server Error',
    ...(err.code && { code: err.code }),
    ...(err.userMessage && { userMessage: err.userMessage }),
    ...(err.meta && { meta: err.meta }),
    requestId: req.context?.requestId,
  })
})

export default app

import morgan from 'morgan'
import logger from '@clyde-api/utils/logger'

morgan.token('request-id', (req: any) => req.context?.requestId || 'no-request-id')

const morganFormat = ':method :url :status :response-time ms - :res[content-length] bytes | requestId=:request-id'

export default () =>
  morgan(morganFormat, {
    stream: {
      write: (message: string) => {
        const statusMatch = message.match(/\s(\d{3})\s/)
        const statusCode = statusMatch ? parseInt(statusMatch[1], 10) : 0
        const meta = { statusCode }
        if (statusCode >= 500) {
          logger.error(message.trim(), meta)
        } else if (statusCode >= 400) {
          logger.warn(message.trim(), meta)
        } else {
          logger.info(message.trim(), meta)
        }
      },
    },
    // Health checks hit every few seconds on Render; only log them when they fail.
    skip: (req: any, res) => req.originalUrl?.startsWith('/healthz') && res.statusCode < 400,
  })

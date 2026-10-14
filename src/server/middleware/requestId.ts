import { Request, Response, NextFunction } from 'express'
import { randomUUID } from 'crypto'

export const attachRequestId = (req: Request, res: Response, next: NextFunction) => {
  const requestId = (req.headers['x-request-id'] as string) || randomUUID()

  if (!req.context) {
    req.context = {}
  }
  req.context.requestId = requestId

  res.setHeader('X-Request-Id', requestId)

  next()
}

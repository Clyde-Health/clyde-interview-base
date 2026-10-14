import dotenv from 'dotenv'
dotenv.config({ quiet: true })

import 'module-alias/register'

import { initServices } from '@clyde-api/config/init'
import { closeDb } from '@clyde-api/utils/database'
import server from '@clyde-api/server/index'
import logger from '@clyde-api/utils/logger'

const PORT = Number(process.env.PORT) || 4000

const main = async () => {
  await initServices({ name: 'api' })

  const httpServer = server.listen(PORT, () => logger.info(`[api] listening on port ${PORT}`))

  // Render sends SIGTERM before replacing an instance. Stop taking requests, then drain the pool.
  const shutdown = (signal: string) => {
    logger.info(`[api] ${signal} received, shutting down`)
    httpServer.close(async () => {
      await closeDb()
      process.exit(0)
    })
  }
  process.on('SIGTERM', () => shutdown('SIGTERM'))
  process.on('SIGINT', () => shutdown('SIGINT'))
}

main().catch((error) => {
  logger.error(error, '[api] failed to start')
  process.exit(1)
})

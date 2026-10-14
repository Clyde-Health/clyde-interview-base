import { Router } from 'express'
import { asyncHandler } from '@clyde-api/utils/asyncHandler'
import { probeDatabaseConnection } from '@clyde-api/utils/database'

const router = Router({ mergeParams: true })

/**
 * GET /healthz
 *
 * Basic health check endpoint with database connectivity check. Render polls this
 * (`healthCheckPath` in render.yaml) and only routes traffic to an instance that answers 200.
 */
router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const databaseProbe = await probeDatabaseConnection()

    res.status(databaseProbe.ok ? 200 : 503).json({
      status: databaseProbe.ok ? 'ok' : 'down',
      database: {
        reachable: databaseProbe.ok,
        probeError: databaseProbe.error || null,
      },
      timestamp: new Date().toISOString(),
    })
  }),
)

export default router

import { Router } from 'express'

import healthcheckRouter from '@clyde-api/server/routers/healthcheck'
import patientsRouter from '@clyde-api/server/routers/patients'

const router = Router()

router.use('/healthz', healthcheckRouter)
router.use('/patients', patientsRouter)

export default router

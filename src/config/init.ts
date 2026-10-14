import { connectDb } from '@clyde-api/utils/database'
import logger from '@clyde-api/utils/logger'

export interface InitOptions {
  name: string
}

// Production also connects Redis, Twilio, Supabase and GrowthBook here, each behind an option flag.
// Add new services the same way: connect them here, not at import time.
export const initServices = async (options: InitOptions) => {
  const { name } = options

  await connectDb()

  logger.info(`[${name}] Services initialized`)
}

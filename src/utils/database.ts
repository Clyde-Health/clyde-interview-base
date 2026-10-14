import { knex, Knex } from 'knex'
import { Model } from 'objection'
import { types } from 'pg'
import logger from '@clyde-api/utils/logger'
import { NODE_ENV } from '@clyde-api/utils/env'

// Import shared config from knexfile
// eslint-disable-next-line @typescript-eslint/no-require-imports
const knexConfig = require('@clyde-api/knexfile')

// Return Postgres DATE columns as 'YYYY-MM-DD' strings instead of JS Dates at local midnight, which
// shift by a day depending on the server's timezone. A date of birth is a calendar date, not an instant.
types.setTypeParser(types.builtins.DATE, (value: string) => value)

let db: Knex | null = null

/**
 * `localhost` resolves to both ::1 and 127.0.0.1, so a refused connection surfaces as an
 * AggregateError with an empty message. Name the target and the likely fix instead.
 */
const describeConnectError = (error: unknown, connection?: { host?: string; port?: number }): Error => {
  const target = `${connection?.host ?? 'unknown host'}:${connection?.port ?? 5432}`
  const code = (error as { code?: string })?.code
  const hint =
    code === 'ECONNREFUSED'
      ? 'Nothing is listening there. Start Postgres with `yarn db:up` (Docker must be running).'
      : error instanceof Error && error.message
        ? error.message
        : String(error)
  return new Error(`Could not connect to Postgres at ${target}. ${hint}`, { cause: error })
}

export async function connectDb(): Promise<Knex> {
  if (db) return db

  const config = knexConfig[NODE_ENV] || knexConfig.development
  const nextDb = knex(config)

  try {
    await nextDb.raw('SELECT 1')
  } catch (error) {
    await nextDb.destroy().catch(() => {})
    throw describeConnectError(error, config.connection)
  }

  Model.knex(nextDb)
  db = nextDb
  logger.info('[database] connected', { env: NODE_ENV })
  return db
}

export const getKnex = (): Knex => {
  if (!db) throw new Error('Database not connected. Call connectDb() first.')
  return db
}

export const probeDatabaseConnection = async (): Promise<{ ok: boolean; error?: string }> => {
  if (!db) return { ok: false, error: 'Database not connected' }

  try {
    await db.raw('SELECT 1')
    return { ok: true }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) }
  }
}

export const closeDb = async (): Promise<void> => {
  if (!db) return
  await db.destroy()
  db = null
}
